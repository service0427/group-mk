-- ============================================
-- 스케줄러용 자동 완료 함수들 V2
-- ============================================
-- 1. 총판이 작업 완료일이 N일 지나도 완료를 누르지 않았을 경우 자동으로 완료 및 캐시 환불
-- 2. 사용자가 총판이 완료처리를 했는데 거래완료를 N일 동안 안할경우 자동으로 거래 완료 및 캐시 지급
-- ============================================
-- 기존 함수 활용 버전
-- notification 중복 방지 처리 포함 (각 알림마다 1초씩 시간차)
-- ============================================

-- ============================================
-- 1. 총판 자동 완료 함수 (기존 mat_complete_slot 활용)
-- 성능: 1000명 처리 시 약 16분 소요 (각 알림 1초 간격)
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
                (SELECT MAX(swi.date) FROM slot_works_info swi WHERE swi.slot_id = s.id) as last_work_date
            FROM public.slots s
            JOIN public.users u ON u.id = s.user_id
            LEFT JOIN public.users m ON m.id = s.mat_id
            JOIN public.campaigns c ON c.id = s.product_id
            WHERE s.status = 'approved'
            AND EXISTS (
                SELECT 1 FROM slot_works_info swi 
                WHERE swi.slot_id = s.id 
                HAVING MAX(swi.date) < CURRENT_DATE - INTERVAL '1 day' * days_after_completion
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
                        format('자동 완료 - 마지막 작업일로부터 %s일 경과', days_after_completion)
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
                    v_errors := v_errors || jsonb_build_object('slot_id', v_slot.slot_id, 'error', SQLERRM);
                END;
            END LOOP;
            
            -- 환불 처리
            IF v_refund_amount > 0 THEN
                INSERT INTO public.user_cash_history (
                    user_id, transaction_type, amount, description, transaction_at
                ) VALUES (
                    v_user_group.user_id, 'refund', v_refund_amount::INTEGER,
                    format('슬롯 자동 완료 환불 (%s건)', v_user_group.slot_count), NOW()
                );
                
                UPDATE public.user_balances
                SET total_balance = total_balance + v_refund_amount,
                    paid_balance = paid_balance + v_refund_amount,
                    updated_at = NOW()
                WHERE user_id = v_user_group.user_id;
                
                v_total_refunded := v_total_refunded + v_refund_amount;
            END IF;
            
            -- 알림 생성 (각 사용자마다 1초씩 차이를 두어 중복 방지)
            BEGIN
                INSERT INTO public.notifications (
                    user_id, type, title, message, link, priority, status, created_at
                ) VALUES (
                    v_user_group.user_id, 'slot', '슬롯 작업 자동 완료',
                    format('%s건의 슬롯이 자동 완료되었습니다. 총 %s원이 환불되었습니다.', 
                        v_user_group.slot_count, v_refund_amount),
                    '/slots', 'high', 'unread', NOW() + (v_second_offset || ' seconds')::interval
                );
            EXCEPTION WHEN unique_violation THEN
                -- 혹시 모를 중복 시 추가 1초 후로 재시도
                INSERT INTO public.notifications (
                    user_id, type, title, message, link, priority, status, created_at
                ) VALUES (
                    v_user_group.user_id, 'slot', '슬롯 작업 자동 완료',
                    format('%s건의 슬롯이 자동 완료되었습니다. 총 %s원이 환불되었습니다.', 
                        v_user_group.slot_count, v_refund_amount),
                    '/slots', 'high', 'unread', NOW() + ((v_second_offset + 1) || ' seconds')::interval
                );
            END;
            
            -- 다음 사용자를 위해 1초 증가
            v_second_offset := v_second_offset + 1;
            
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
-- 성능: 1000개 슬롯 처리 시 약 16분 소요 (각 알림 1초 간격)
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
-- 권한 설정
-- ============================================
GRANT EXECUTE ON FUNCTION public.auto_complete_overdue_slots(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_confirm_completed_slots(INT) TO service_role;

-- ============================================
-- 테스트 코드 (ROLLBACK 포함)
-- 주의: 알림은 각 사용자/슬롯마다 1초씩 차이를 두어 생성됨
-- ============================================

-- 1. 자동 완료 테스트 (ROLLBACK 가능)
/*
BEGIN;
    -- 현재 상태 확인
    SELECT s.id, s.status, u.full_name as user_name, 
           (SELECT MAX(date) FROM slot_works_info WHERE slot_id = s.id) as last_work_date
    FROM slots s
    JOIN users u ON s.user_id = u.id
    WHERE s.status = 'approved'
    AND EXISTS (
        SELECT 1 FROM slot_works_info swi 
        WHERE swi.slot_id = s.id 
        HAVING MAX(swi.date) < CURRENT_DATE - INTERVAL '7 days'
    );
    
    -- 함수 실행
    SELECT * FROM public.auto_complete_overdue_slots(7);
    
    -- 결과 확인
    SELECT * FROM slots WHERE status = 'completed' AND processed_at > NOW() - INTERVAL '1 minute';
    SELECT * FROM user_cash_history WHERE transaction_at > NOW() - INTERVAL '1 minute';
    SELECT * FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';
    
    -- 롤백 (테스트 완료 후)
    ROLLBACK;
    -- 실제 적용시: COMMIT;
END;
*/

-- 2. 자동 거래완료 테스트 (ROLLBACK 가능)
/*
BEGIN;
    -- 현재 상태 확인
    SELECT s.id, s.status, u.full_name as user_name,
           (SELECT created_at FROM slot_history_logs 
            WHERE slot_id = s.id AND action = 'mat_complete' 
            ORDER BY created_at DESC LIMIT 1) as mat_completed_at
    FROM slots s
    JOIN users u ON s.user_id = u.id
    WHERE s.status = 'pending_user_confirm';
    
    -- 함수 실행
    SELECT * FROM public.auto_confirm_completed_slots(3);
    
    -- 결과 확인
    SELECT * FROM slots WHERE status = 'completed' AND processed_at > NOW() - INTERVAL '1 minute';
    SELECT * FROM user_cash_history WHERE transaction_at > NOW() - INTERVAL '1 minute';
    SELECT * FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';
    
    -- 롤백 (테스트 완료 후)
    ROLLBACK;
    -- 실제 적용시: COMMIT;
END;
*/

-- ============================================
-- 크론잡 설정
-- ============================================
/*
-- 자동 총판 작업 완료 처리 만료일 + 2일 슬롯들만 , 매일 새벽 1시에 작동
SELECT cron.schedule('auto-complete-overdue-slots', '0 1 * * *', 
    'SELECT public.auto_complete_overdue_slots(2);');

-- 자동 거래 완료 처리 완료 처리후 + 2일 슬롯들만 , 매일 새벽 2시에 작동
SELECT cron.schedule('auto-confirm-completed-slots', '0 2 * * *', 
    'SELECT public.auto_confirm_completed_slots(2);');
*/