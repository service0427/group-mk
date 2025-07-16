-- ============================================
-- 자동 완료 함수 수정본 - campaign_id를 product_id로 변경
-- ============================================
-- 크론 로그에서 확인된 오류 수정:
-- ERROR: column s.campaign_id does not exist
-- ============================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.auto_complete_overdue_slots(integer);

-- 총판 자동 완료 함수 (타임존 적용 + 올바른 컬럼명 사용)
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
            JOIN public.campaigns c ON c.id = s.product_id  -- 수정: s.campaign_id -> s.product_id
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

-- 이 함수를 실행하여 기존 함수를 교체
-- 크론 스케줄은 이미 설정되어 있으므로 함수만 교체하면 자동으로 올바르게 작동함