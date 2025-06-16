-- ============================================
-- 스케줄러용 자동 완료 함수들 V4
-- ============================================
-- 1. 총판이 작업 완료일이 N일 지나도 완료를 누르지 않았을 경우 자동으로 완료 및 캐시 환불
-- 2. 사용자가 총판이 완료처리를 했는데 거래완료를 N일 동안 안할경우 자동으로 거래 완료 및 캐시 지급
-- ============================================
-- V4 수정사항: end_date와 dueDays를 고려하여 실제 작업 기한이 지난 경우에만 자동 완료
-- ============================================

-- ============================================
-- 1. 총판 자동 완료 함수 (기존 mat_complete_slot 활용)
-- V4: end_date가 지났거나, end_date가 없으면 submitted_at + dueDays가 지난 경우만 처리
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
            -- V4 수정: end_date 또는 dueDays 기반 실제 작업 기한 체크
            AND (
                -- 1. end_date가 있고 현재 날짜 + N일을 지난 경우
                (
                    s.end_date IS NOT NULL 
                    AND s.end_date < CURRENT_DATE - INTERVAL '1 day' * days_after_completion
                )
                OR
                -- 2. end_date가 없지만 dueDays가 있고, submitted_at + dueDays + N일을 지난 경우
                (
                    s.end_date IS NULL
                    AND s.input_data->>'dueDays' IS NOT NULL
                    AND s.submitted_at < NOW() - INTERVAL '1 day' * ((s.input_data->>'dueDays')::INT + days_after_completion)
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
                            HAVING MAX(swi.date) < CURRENT_DATE - INTERVAL '1 day' * days_after_completion
                        )
                        OR
                        -- 작업이 없는 경우: 승인일이 N일 이상 경과
                        (
                            NOT EXISTS (SELECT 1 FROM slot_works_info swi WHERE swi.slot_id = s.id)
                            AND s.submitted_at < NOW() - INTERVAL '1 day' * days_after_completion
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
            COUNT(*) as slot_count,
            MIN(user_name) as user_name
        FROM overdue_slots
        GROUP BY user_id
    LOOP
        BEGIN
            v_refund_amount := 0;
            
            -- 각 슬롯 처리
            FOR v_slot IN SELECT unnest(v_user_group.slot_ids) as slot_id
            LOOP
                BEGIN
                    -- mat_complete_slot 호출
                    v_completion_result := mat_complete_slot(
                        v_slot.slot_id, 
                        (SELECT mat_id FROM slots WHERE id = v_slot.slot_id),
                        format('자동 완료 - 작업 기한 경과 후 %s일 지남', days_after_completion)
                    );
                    
                    -- 정산 정보 조회
                    SELECT * INTO v_settlement FROM calculate_slot_settlement(v_slot.slot_id);
                    v_refund_amount := v_refund_amount + v_settlement.base_amount;
                    
                    -- 슬롯 상태 업데이트
                    UPDATE public.slots
                    SET status = 'completed', processed_at = NOW()
                    WHERE id = v_slot.slot_id;
                    
                    UPDATE public.slot_pending_balances
                    SET status = 'processed', processed_at = NOW()
                    WHERE slot_id = v_slot.slot_id;
                    
                    v_processed := v_processed + 1;
                    
                EXCEPTION WHEN OTHERS THEN
                    v_errors := v_errors || jsonb_build_object(
                        'slot_id', v_slot.slot_id, 'error', SQLERRM
                    );
                END;
            END LOOP;
            
            -- 환불 금액이 있으면 캐시 반환
            IF v_refund_amount > 0 THEN
                -- 캐시 반환
                UPDATE public.users
                SET cash_amount = cash_amount + v_refund_amount
                WHERE id = v_user_group.user_id;
                
                -- 알림 발송 (각 사용자마다 1초씩 차이를 두어 중복 방지)
                BEGIN
                    INSERT INTO public.notifications (
                        user_id, type, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_user_group.user_id, 'transaction', '작업 미완료 자동 완료',
                        format('총 %s개의 슬롯이 작업 기한 경과로 자동 완료되었습니다. %s원이 반환되었습니다. (총판: %s)', 
                            v_user_group.slot_count, v_refund_amount, 
                            array_to_string(v_user_group.mat_names, ', ')),
                        '/slots', 'high', 'unread', 
                        NOW() + (v_second_offset || ' seconds')::interval
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- 혹시 모를 중복 시 추가 1초 후로 재시도
                    INSERT INTO public.notifications (
                        user_id, type, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_user_group.user_id, 'transaction', '작업 미완료 자동 완료',
                        format('총 %s개의 슬롯이 작업 기한 경과로 자동 완료되었습니다. %s원이 반환되었습니다. (총판: %s)', 
                            v_user_group.slot_count, v_refund_amount, 
                            array_to_string(v_user_group.mat_names, ', ')),
                        '/slots', 'high', 'unread', 
                        NOW() + ((v_second_offset + 1) || ' seconds')::interval
                    );
                END;
                
                -- 다음 사용자를 위해 1초 증가
                v_second_offset := v_second_offset + 1;
                
                v_total_refunded := v_total_refunded + v_refund_amount;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'user_id', v_user_group.user_id, 'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed, 'refunded', v_total_refunded,
        'errors', v_errors, 'executed_at', NOW()
    );
END;
$$;

-- ============================================
-- 2. 사용자 자동 거래완료 함수 (기존 user_confirm_slot_completion 활용)
-- V4: 변경사항 없음 (이미 총판 완료 후 경과 시간 체크하므로)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_confirm_completed_slots(days_after_completion INT DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := '{"processed": 0, "paid": 0, "errors": []}'::jsonb;
    v_slot RECORD;
    v_confirm_result jsonb;
    v_processed INT := 0;
    v_total_paid NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_payment_amount NUMERIC;
    v_second_offset INT := 0;
BEGIN
    -- 대기 중인 슬롯들 처리
    FOR v_slot IN 
        SELECT 
            s.id as slot_id,
            s.user_id,
            s.mat_id,
            u.full_name as user_name,
            m.full_name as mat_name,
            (SELECT shl.created_at 
             FROM slot_history_logs shl 
             WHERE shl.slot_id = s.id AND shl.action = 'mat_complete' 
             ORDER BY shl.created_at DESC LIMIT 1) as mat_completed_at,
            (SELECT cs.user_payment_amount FROM calculate_slot_settlement(s.id) cs) as payment_amount
        FROM public.slots s
        JOIN public.users u ON u.id = s.user_id
        JOIN public.users m ON m.id = s.mat_id
        WHERE s.status = 'pending_user_confirm'
        AND EXISTS (
            SELECT 1 FROM slot_history_logs shl 
            WHERE shl.slot_id = s.id AND shl.action = 'mat_complete'
            AND shl.created_at < NOW() - INTERVAL '1 day' * days_after_completion
        )
    LOOP
        BEGIN
            -- user_confirm_slot_completion 호출
            v_confirm_result := user_confirm_slot_completion(
                v_slot.slot_id, v_slot.user_id,
                format('자동 거래완료 - 총판 완료 후 %s일 경과', days_after_completion)
            );
            
            IF (v_confirm_result->>'success')::boolean THEN
                v_processed := v_processed + 1;
                v_total_paid := v_total_paid + v_slot.payment_amount;
                
                -- MAT에게 알림 (각 슬롯마다 1초씩 차이를 두어 중복 방지)
                BEGIN
                    INSERT INTO public.notifications (
                        user_id, type, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_slot.mat_id, 'transaction', '슬롯 작업 자동 거래완료',
                        format('사용자(%s)가 거래완료를 하지 않아 자동 완료되었습니다. %s원이 지급되었습니다.', 
                            v_slot.user_name, v_slot.payment_amount),
                        format('/slots/%s', v_slot.slot_id), 'high', 'unread', 
                        NOW() + (v_second_offset || ' seconds')::interval
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- 혹시 모를 중복 시 추가 1초 후로 재시도
                    INSERT INTO public.notifications (
                        user_id, type, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_slot.mat_id, 'transaction', '슬롯 작업 자동 거래완료',
                        format('사용자(%s)가 거래완료를 하지 않아 자동 완료되었습니다. %s원이 지급되었습니다.', 
                            v_slot.user_name, v_slot.payment_amount),
                        format('/slots/%s', v_slot.slot_id), 'high', 'unread', 
                        NOW() + ((v_second_offset + 1) || ' seconds')::interval
                    );
                END;
                
                -- 다음 슬롯을 위해 1초 증가
                v_second_offset := v_second_offset + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'slot_id', v_slot.slot_id, 'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed, 'paid', v_total_paid,
        'errors', v_errors, 'executed_at', NOW()
    );
END;
$$;

-- ============================================
-- 스케줄러 설정 예시 (pg_cron 사용시)
-- ============================================
-- 매일 새벽 1시에 자동 완료 실행 (작업 기한 후 2일 경과 기준)
-- SELECT cron.schedule('auto-complete-overdue-slots', '0 1 * * *', 'SELECT auto_complete_overdue_slots(2);');

-- 매일 새벽 2시에 자동 거래완료 실행 (총판 완료 후 2일 경과 기준)  
-- SELECT cron.schedule('auto-confirm-completed-slots', '0 2 * * *', 'SELECT auto_confirm_completed_slots(2);');