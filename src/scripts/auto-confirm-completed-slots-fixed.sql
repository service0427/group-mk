-- ============================================
-- 자동 거래완료 함수 수정본
-- ============================================
-- 타임존 적용 및 올바른 함수명 사용
-- ============================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.auto_confirm_completed_slots(integer);

-- 사용자 자동 거래완료 함수 (타임존 적용)
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

-- 이 함수를 실행하여 기존 함수를 교체
-- 크론 스케줄은 이미 설정되어 있으므로 함수만 교체하면 자동으로 올바르게 작동함