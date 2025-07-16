-- ============================================
-- 스케줄러용 자동 완료 함수들 V4 - 타임존 수정 버전
-- ============================================
-- 한국 시간대(Asia/Seoul) 적용
-- ============================================

-- ============================================
-- 1. 총판 자동 완료 함수 (타임존 수정)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_complete_overdue_slots(days_after_completion INT DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := '{"processed": 0, "refunded": 0, "errors": []}'::jsonb;
    v_user_group RECORD;
    v_slot RECORD;
    v_completion_result jsonb;
    v_settlement RECORD;
    v_processed INT := 0;
    v_total_refunded NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_refund_amount NUMERIC;
    v_user_balance NUMERIC;
    v_second_offset INT := 0;
    v_current_date DATE := (NOW() AT TIME ZONE 'Asia/Seoul')::date;
    v_current_time TIMESTAMP := NOW() AT TIME ZONE 'Asia/Seoul';
BEGIN
    -- 마지막 작업일로부터 N일 경과했지만 완료되지 않은 슬롯들을 사용자별로 그룹화
    FOR v_user_group IN 
        WITH overdue_slots AS (
            SELECT 
                s.id as slot_id,
                s.user_id,
                s.mat_id,
                c.campaign_name,
                u.full_name as user_name,
                m.full_name as mat_name,
                s.end_date,
                s.submitted_at,
                -- input_data에서 dueDays 추출
                COALESCE(
                    (s.input_data->>'dueDays')::INT,
                    CASE 
                        WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                        THEN EXTRACT(DAY FROM (s.end_date::DATE - s.start_date::DATE))::INT + 1
                        ELSE NULL
                    END
                ) as due_days,
                (SELECT MAX(swi.date) FROM slot_works_info swi WHERE swi.slot_id = s.id) as last_work_date
            FROM public.slots s
            JOIN public.users u ON u.id = s.user_id
            LEFT JOIN public.users m ON m.id = s.mat_id
            JOIN public.campaigns c ON c.id = s.product_id
            WHERE s.status = 'approved'
            -- V4 수정: end_date 또는 dueDays 기반 실제 작업 기한 체크 (타임존 적용)
            AND (
                -- 1. end_date가 있고 현재 날짜 + N일을 지난 경우
                (
                    s.end_date IS NOT NULL 
                    AND s.end_date < v_current_date - INTERVAL '1 day' * days_after_completion
                )
                OR
                -- 2. end_date가 없지만 dueDays가 있고, submitted_at + dueDays + N일을 지난 경우
                (
                    s.end_date IS NULL
                    AND s.input_data->>'dueDays' IS NOT NULL
                    AND s.submitted_at < v_current_time - INTERVAL '1 day' * ((s.input_data->>'dueDays')::INT + days_after_completion)
                )
                OR
                -- 3. end_date도 없고 dueDays도 없는 경우, 기존 로직 유지 (작업일 기준)
                (
                    s.end_date IS NULL
                    AND (s.input_data->>'dueDays' IS NULL OR s.input_data->>'dueDays' = '')
                    AND (
                        -- 작업이 있는 경우: 마지막 작업일이 N일 이상 경과
                        s.id IN (
                            SELECT DISTINCT swi.slot_id 
                            FROM slot_works_info swi 
                            GROUP BY swi.slot_id
                            HAVING MAX(swi.date) < v_current_date - INTERVAL '1 day' * days_after_completion
                        )
                        OR
                        -- 작업이 없는 경우: 승인일이 N일 이상 경과
                        (
                            NOT EXISTS (SELECT 1 FROM slot_works_info swi WHERE swi.slot_id = s.id)
                            AND s.submitted_at < v_current_time - INTERVAL '1 day' * days_after_completion
                        )
                    )
                )
            )
        )
        SELECT 
            user_id,
            array_agg(slot_id) as slot_ids,
            array_agg(DISTINCT mat_name) as mat_names,
            array_agg(campaign_name) as campaign_names,
            MAX(user_name) as user_name
        FROM overdue_slots
        GROUP BY user_id
    LOOP
        -- 사용자별로 슬롯 처리
        FOR v_slot IN
            SELECT * FROM unnest(v_user_group.slot_ids) as slot_id
        LOOP
            BEGIN
                -- mat_complete_slot 함수를 호출하여 완료 처리
                v_completion_result := mat_complete_slot(
                    v_slot.slot_id,
                    (SELECT mat_id FROM public.slots WHERE id = v_slot.slot_id),
                    format('자동완료 - 작업 기한 %s일 초과', days_after_completion)
                );
                
                IF v_completion_result->>'success' = 'true' THEN
                    v_processed := v_processed + 1;
                    
                    -- 슬롯 상태 업데이트
                    UPDATE public.slots
                    SET status = 'completed', processed_at = v_current_time
                    WHERE id = v_slot.slot_id;
                    
                    UPDATE public.slot_pending_balances
                    SET status = 'processed', processed_at = v_current_time
                    WHERE slot_id = v_slot.slot_id;
                    
                    -- 환불 금액 추가
                    v_refund_amount := COALESCE((v_completion_result->'settlement'->>'refund_amount')::NUMERIC, 0);
                    v_total_refunded := v_total_refunded + v_refund_amount;
                END IF;
                
            EXCEPTION WHEN OTHERS THEN
                -- 에러 로그
                v_errors := v_errors || jsonb_build_object(
                    'slot_id', v_slot.slot_id,
                    'error', SQLERRM
                );
                RAISE NOTICE '슬롯 % 처리 중 오류 발생: %', v_slot.slot_id, SQLERRM;
            END;
        END LOOP;
        
        -- 사용자에게 알림 발송
        BEGIN
            INSERT INTO public.notifications (
                user_id, category, title, message, link, priority, status, created_at
            ) VALUES (
                v_user_group.user_id, 'slot', '미완료 슬롯 자동 완료 처리',
                format('%s개의 슬롯이 작업 기한 초과로 자동 완료 처리되었습니다. 총판: %s',
                    array_length(v_user_group.slot_ids, 1),
                    array_to_string(v_user_group.mat_names, ', ')),
                '/slots', 'high', 'unread', 
                v_current_time + (v_second_offset || ' seconds')::interval
            );
        EXCEPTION WHEN unique_violation THEN
            -- 중복 알림 무시
        WHEN OTHERS THEN
            -- 재시도 (1초 후)
            BEGIN
                INSERT INTO public.notifications (
                    user_id, category, title, message, link, priority, status, created_at
                ) VALUES (
                    v_user_group.user_id, 'slot', '미완료 슬롯 자동 완료 처리',
                    format('%s개의 슬롯이 작업 기한 초과로 자동 완료 처리되었습니다. 총판: %s',
                        array_length(v_user_group.slot_ids, 1),
                        array_to_string(v_user_group.mat_names, ', ')),
                    '/slots', 'high', 'unread', 
                    v_current_time + ((v_second_offset + 1) || ' seconds')::interval
                );
            END;
        END;
        
        v_second_offset := v_second_offset + 2;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed, 'refunded', v_total_refunded,
        'errors', v_errors, 'executed_at', v_current_time
    );
END;
$$;

-- ============================================
-- 2. 사용자 자동 거래완료 함수 (타임존 수정)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_confirm_completed_slots(days_after_completion INT DEFAULT 2)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := '{"processed": 0, "paid": 0, "errors": []}'::jsonb;
    v_slot RECORD;
    v_processed INT := 0;
    v_total_paid NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_confirmation_result jsonb;
    v_payment_amount NUMERIC;
    v_second_offset INT := 0;
    v_current_time TIMESTAMP := NOW() AT TIME ZONE 'Asia/Seoul';
BEGIN
    -- pending_user_confirm 상태로 N일 이상 경과한 슬롯들
    FOR v_slot IN
        SELECT 
            s.id as slot_id,
            s.user_id,
            s.mat_id,
            m.full_name as mat_name,
            u.full_name as user_name,
            c.campaign_name,
            spb.amount as payment_amount
        FROM public.slots s
        JOIN public.users u ON u.id = s.user_id
        JOIN public.users m ON m.id = s.mat_id
        JOIN public.campaigns c ON c.id = s.product_id
        LEFT JOIN public.slot_pending_balances spb ON spb.slot_id = s.id
        WHERE s.status = 'pending_user_confirm'
        AND EXISTS (
            SELECT 1 FROM slot_history_logs shl 
            WHERE shl.slot_id = s.id AND shl.action = 'mat_complete'
            AND shl.created_at < v_current_time - INTERVAL '1 day' * days_after_completion
        )
    LOOP
        BEGIN
            -- user_confirm_slot_completion 함수를 호출하여 거래 완료 처리
            -- 주의: 함수명이 user_confirm_slot_completion이 맞습니다
            v_confirmation_result := user_confirm_slot_completion(
                v_slot.slot_id,
                v_slot.user_id,
                format('자동 거래완료 - 총판 완료 후 %s일 초과', days_after_completion)
            );
            
            IF v_confirmation_result->>'success' = 'true' THEN
                v_processed := v_processed + 1;
                v_total_paid := v_total_paid + COALESCE(v_slot.payment_amount, 0);
                
                -- 총판에게 알림 발송
                BEGIN
                    INSERT INTO public.notifications (
                        user_id, category, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_slot.mat_id, 'slot', '자동 거래완료 처리',
                        format('캠페인 "%s" 슬롯이 자동으로 거래완료 처리되었습니다. 사용자: %s, 지급액: %s원',
                            v_slot.campaign_name,
                            v_slot.user_name, v_slot.payment_amount),
                        format('/slots/%s', v_slot.slot_id), 'high', 'unread', 
                        v_current_time + (v_second_offset || ' seconds')::interval
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- 중복 알림 무시
                WHEN OTHERS THEN
                    -- 재시도
                    INSERT INTO public.notifications (
                        user_id, category, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_slot.mat_id, 'slot', '자동 거래완료 처리',
                        format('캠페인 "%s" 슬롯이 자동으로 거래완료 처리되었습니다. 사용자: %s, 지급액: %s원',
                            v_slot.campaign_name,
                            v_slot.user_name, v_slot.payment_amount),
                        format('/slots/%s', v_slot.slot_id), 'high', 'unread', 
                        v_current_time + ((v_second_offset + 1) || ' seconds')::interval
                    );
                END;
                
                v_second_offset := v_second_offset + 2;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- 에러 로그
            v_errors := v_errors || jsonb_build_object(
                'slot_id', v_slot.slot_id,
                'error', SQLERRM
            );
            RAISE NOTICE '슬롯 % 확인 처리 중 오류 발생: %', v_slot.slot_id, SQLERRM;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed, 'paid', v_total_paid,
        'errors', v_errors, 'executed_at', v_current_time
    );
END;
$$;

-- ============================================
-- 스케줄러 설정 (pg_cron)
-- ============================================
-- 기존 스케줄 삭제
SELECT cron.unschedule('auto-complete-overdue-slots') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-complete-overdue-slots');
SELECT cron.unschedule('auto-confirm-completed-slots') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-confirm-completed-slots');

-- 매일 새벽 1시에 자동 완료 실행 (작업 기한 후 2일 경과 기준)
SELECT cron.schedule('auto-complete-overdue-slots', '0 1 * * *', 'SELECT auto_complete_overdue_slots(2);');

-- 매일 새벽 2시에 자동 거래완료 실행 (총판 완료 후 2일 경과 기준)  
SELECT cron.schedule('auto-confirm-completed-slots', '0 2 * * *', 'SELECT auto_confirm_completed_slots(2);');

-- ============================================
-- 테스트 쿼리
-- ============================================
/*
-- 자동완료 대상 확인 (2일 기준)
WITH overdue_check AS (
    SELECT 
        s.id,
        c.campaign_name,
        s.end_date,
        s.submitted_at,
        (s.input_data->>'dueDays')::INT as due_days,
        CASE 
            WHEN s.end_date IS NOT NULL THEN 
                s.end_date::TEXT || ' (종료일 기준)'
            WHEN s.input_data->>'dueDays' IS NOT NULL THEN 
                (s.submitted_at::DATE + INTERVAL '1 day' * (s.input_data->>'dueDays')::INT)::TEXT || ' (dueDays 기준)'
            ELSE 
                '마지막 작업일 기준'
        END as deadline_info,
        (NOW() AT TIME ZONE 'Asia/Seoul')::date as today
    FROM slots s
    JOIN campaigns c ON c.id = s.product_id
    WHERE s.status = 'approved'
)
SELECT * FROM overdue_check
WHERE 
    (end_date IS NOT NULL AND end_date < (NOW() AT TIME ZONE 'Asia/Seoul')::date - INTERVAL '2 days')
    OR (end_date IS NULL AND due_days IS NOT NULL AND submitted_at < (NOW() AT TIME ZONE 'Asia/Seoul') - INTERVAL '1 day' * (due_days + 2));

-- 자동 거래완료 대상 확인
SELECT 
    s.id,
    c.campaign_name,
    s.status,
    shl.created_at as mat_completed_at,
    (NOW() AT TIME ZONE 'Asia/Seoul') - shl.created_at as elapsed_time
FROM slots s
JOIN campaigns c ON c.id = s.product_id
JOIN slot_history_logs shl ON shl.slot_id = s.id AND shl.action = 'mat_complete'
WHERE s.status = 'pending_user_confirm'
AND shl.created_at < (NOW() AT TIME ZONE 'Asia/Seoul') - INTERVAL '2 days';

-- 수동 실행
SELECT auto_complete_overdue_slots(2);
SELECT auto_confirm_completed_slots(2);
*/