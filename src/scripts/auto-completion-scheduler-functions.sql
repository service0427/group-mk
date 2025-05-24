-- ============================================
-- 스케줄러용 자동 완료 함수들
-- ============================================
-- 1. 총판이 작업 완료일이 N일 지나도 완료를 누르지 않았을 경우 자동으로 완료 및 캐시 환불
-- 2. 사용자가 총판이 완료처리를 했는데 거래완료를 N일 동안 안할경우 자동으로 거래 완료 및 캐시 지급
-- ============================================
-- 주의: 실제 테이블 구조에 맞게 수정됨
-- slot_works → slot_works_info
-- cash_requests → user_cash_history
-- user_balances 컬럼명 수정
-- notifications 처리는 주석 처리됨 (추후 구조 확인 후 추가)
-- ============================================

-- ============================================
-- 1. 총판 자동 완료 함수 (N일 경과 시 자동 완료 및 환불)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_complete_overdue_slots(days_after_completion INT DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := '{"processed": 0, "refunded": 0, "errors": []}'::jsonb;
    v_slot RECORD;
    v_processed INT := 0;
    v_refunded INT := 0;
    v_errors jsonb := '[]'::jsonb;
    v_refund_amount NUMERIC;
    v_user_balance NUMERIC;
BEGIN
    -- 완료일이 지난 지 N일 이상 경과했지만 아직 완료되지 않은 슬롯들 조회
    FOR v_slot IN 
        SELECT 
            sw.id,
            sw.slot_id,
            sw.user_id,
            sw.provider_id as distributor_id,  -- provider_id를 distributor_id로 별칭
            sw.amount as cash_amount,  -- amount를 cash_amount로 사용
            0 as point_amount,  -- point_amount는 없으므로 0으로 설정
            sw.completed_at as completion_date,
            u.full_name as user_name,  -- username → full_name
            d.full_name as distributor_name  -- username → full_name
        FROM public.slot_works_info sw
        JOIN public.users u ON u.id = sw.user_id
        JOIN public.users d ON d.id = sw.provider_id  -- distributor_id → provider_id
        WHERE sw.status = 'in_progress'
        AND sw.completed_at IS NOT NULL  -- completion_date → completed_at
        AND sw.completed_at < CURRENT_DATE - INTERVAL '1 day' * days_after_completion
        AND sw.is_completed = false
        FOR UPDATE OF sw
    LOOP
        BEGIN
            -- 트랜잭션 시작
            -- 1. slot_works_info 상태를 completed로 변경
            UPDATE public.slot_works_info
            SET 
                status = 'completed',
                is_completed = true,
                completed_at = COALESCE(completed_at, NOW()),  -- 이미 있으면 유지
                updated_at = NOW()
            WHERE id = v_slot.id;
            
            -- 2. 환불 금액 계산 (캐시만 환불, 포인트는 환불하지 않음)
            v_refund_amount := v_slot.cash_amount;
            
            -- 3. 사용자 잔액 업데이트
            UPDATE public.user_balances
            SET 
                total_balance = total_balance + v_refund_amount,
                paid_balance = paid_balance + v_refund_amount,  -- 환불은 paid_balance로
                updated_at = NOW()
            WHERE user_id = v_slot.user_id
            RETURNING total_balance INTO v_user_balance;
            
            -- 4. 캐시 이력 기록 (환불)
            INSERT INTO public.user_cash_history (
                user_id,
                request_type,
                amount,
                description,
                approval_status,
                after_total_balance,
                created_at,
                updated_at
            ) VALUES (
                v_slot.user_id,
                'slot_refund',  -- refund → slot_refund
                v_refund_amount,
                format('슬롯 자동 완료에 따른 환불 (슬롯 ID: %s, 총판 미처리)', v_slot.slot_id),
                'approved',  -- status → approval_status
                v_user_balance,
                NOW(),
                NOW()
            );
            
            -- 5. 알림 생성 (사용자에게)
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                link,
                priority,
                status,
                created_at
            ) VALUES (
                v_slot.user_id,
                'slot',
                '슬롯 작업 자동 완료',
                format('총판(%s)이 완료 처리를 하지 않아 자동으로 완료되었습니다. 캐시 %s원이 환불되었습니다.', 
                    v_slot.distributor_name, 
                    v_refund_amount::TEXT),
                format('/slots/%s', v_slot.slot_id),  -- 슬롯 상세 페이지 링크
                'high',  -- 중요도 높음
                'unread',
                NOW()
            );
            
            -- 6. 알림 생성 (총판에게)
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                link,
                priority,
                status,
                created_at
            ) VALUES (
                v_slot.distributor_id,
                'slot',
                '슬롯 작업 자동 완료 처리',
                format('완료일로부터 %s일이 경과하여 자동으로 완료 처리되었습니다. (사용자: %s)', 
                    days_after_completion::TEXT,
                    v_slot.user_name),
                format('/slots/%s', v_slot.slot_id),  -- 슬롯 상세 페이지 링크
                'medium',  -- 중요도 보통
                'unread',
                NOW()
            );
            
            v_processed := v_processed + 1;
            v_refunded := v_refunded + v_refund_amount;
            
        EXCEPTION WHEN OTHERS THEN
            -- 오류 발생 시 기록
            v_errors := v_errors || jsonb_build_object(
                'slot_work_id', v_slot.id,
                'error', SQLERRM
            );
            -- 개별 트랜잭션이므로 다음 레코드 처리 계속
        END;
    END LOOP;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'processed', v_processed,
        'refunded', v_refunded,
        'errors', v_errors,
        'executed_at', NOW()
    );
END;
$$;

-- ============================================
-- 2. 사용자 자동 거래완료 함수 (N일 경과 시 자동 거래완료 및 캐시 지급)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_confirm_completed_slots(days_after_completion INT DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := '{"processed": 0, "paid": 0, "errors": []}'::jsonb;
    v_slot RECORD;
    v_processed INT := 0;
    v_paid NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_payment_amount NUMERIC;
    v_distributor_balance NUMERIC;
BEGIN
    -- 총판이 완료처리 했지만 사용자가 N일 동안 거래완료 안한 슬롯들 조회
    FOR v_slot IN 
        SELECT 
            sw.id,
            sw.slot_id,
            sw.user_id,
            sw.provider_id as distributor_id,  -- provider_id를 distributor_id로 별칭
            sw.amount as cash_amount,  -- amount를 cash_amount로 사용
            0 as point_amount,  -- point_amount는 없으므로 0으로 설정
            sw.completed_at as distributor_completed_at,
            u.full_name as user_name,  -- username → full_name
            d.full_name as distributor_name  -- username → full_name
        FROM public.slot_works_info sw
        JOIN public.users u ON u.id = sw.user_id
        JOIN public.users d ON d.id = sw.provider_id  -- distributor_id → provider_id
        WHERE sw.status = 'completed'
        AND sw.is_completed = true
        AND sw.is_user_confirmed = false  -- user_confirmed → is_user_confirmed
        AND sw.completed_at IS NOT NULL
        AND sw.completed_at < NOW() - INTERVAL '1 day' * days_after_completion
        FOR UPDATE OF sw
    LOOP
        BEGIN
            -- 트랜잭션 시작
            -- 1. slot_works_info에 사용자 거래완료 표시
            UPDATE public.slot_works_info
            SET 
                is_user_confirmed = true,
                user_confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = v_slot.id;
            
            -- 2. 지급 금액 계산 (캐시만 지급)
            v_payment_amount := v_slot.cash_amount;
            
            -- 3. 총판 잔액 업데이트
            UPDATE public.user_balances
            SET 
                total_balance = total_balance + v_payment_amount,
                paid_balance = paid_balance + v_payment_amount,  -- 수익은 paid_balance로
                updated_at = NOW()
            WHERE user_id = v_slot.distributor_id
            RETURNING total_balance INTO v_distributor_balance;
            
            -- 4. 캐시 이력 기록 (수익)
            INSERT INTO public.user_cash_history (
                user_id,
                request_type,
                amount,
                description,
                approval_status,
                after_total_balance,
                created_at,
                updated_at
            ) VALUES (
                v_slot.distributor_id,
                'slot_revenue',  -- 슬롯 수익
                v_payment_amount,
                format('슬롯 작업 자동 거래완료 수익 (슬롯 ID: %s, 사용자: %s)', 
                    v_slot.slot_id, 
                    v_slot.user_name),
                'approved',  -- status → approval_status
                v_distributor_balance,
                NOW(),
                NOW()
            );
            
            -- 5. 알림 생성 (총판에게)
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                link,
                priority,
                status,
                created_at
            ) VALUES (
                v_slot.distributor_id,
                'transaction',  -- 거래 관련
                '슬롯 작업 자동 거래완료',
                format('사용자(%s)가 %s일 동안 거래완료를 하지 않아 자동으로 완료되었습니다. 캐시 %s원이 지급되었습니다.', 
                    v_slot.user_name,
                    days_after_completion::TEXT, 
                    v_payment_amount::TEXT),
                format('/slots/%s', v_slot.slot_id),
                'high',  -- 중요도 높음 (캐시 지급)
                'unread',
                NOW()
            );
            
            -- 6. 알림 생성 (사용자에게)
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                link,
                priority,
                status,
                created_at
            ) VALUES (
                v_slot.user_id,
                'slot',
                '슬롯 작업 자동 거래완료 처리',
                format('완료일로부터 %s일이 경과하여 자동으로 거래완료 처리되었습니다.', 
                    days_after_completion::TEXT),
                format('/slots/%s', v_slot.slot_id),
                'medium',  -- 중요도 보통
                'unread',
                NOW()
            );
            
            v_processed := v_processed + 1;
            v_paid := v_paid + v_payment_amount;
            
        EXCEPTION WHEN OTHERS THEN
            -- 오류 발생 시 기록
            v_errors := v_errors || jsonb_build_object(
                'slot_work_id', v_slot.id,
                'error', SQLERRM
            );
            -- 개별 트랜잭션이므로 다음 레코드 처리 계속
        END;
    END LOOP;
    
    -- 결과 반환
    RETURN jsonb_build_object(
        'processed', v_processed,
        'paid', v_paid,
        'errors', v_errors,
        'executed_at', NOW()
    );
END;
$$;

-- ============================================
-- 권한 설정
-- ============================================
GRANT EXECUTE ON FUNCTION public.auto_complete_overdue_slots(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_confirm_completed_slots(INT) TO service_role;

-- ============================================
-- 테스트 쿼리
-- ============================================
-- 1. 총판 자동 완료 테스트 (7일 경과)
-- SELECT * FROM public.auto_complete_overdue_slots(7);

-- 2. 사용자 자동 거래완료 테스트 (3일 경과)  
-- SELECT * FROM public.auto_confirm_completed_slots(3);

-- 3. 커스텀 일수로 테스트
-- SELECT * FROM public.auto_complete_overdue_slots(14); -- 14일 경과
-- SELECT * FROM public.auto_confirm_completed_slots(5); -- 5일 경과

-- ============================================
-- Supabase 크론잡 설정 예시
-- ============================================
/*
-- 매일 새벽 2시에 실행
SELECT cron.schedule(
    'auto-complete-overdue-slots',
    '0 2 * * *',
    'SELECT public.auto_complete_overdue_slots(7);'
);

-- 매일 새벽 3시에 실행
SELECT cron.schedule(
    'auto-confirm-completed-slots', 
    '0 3 * * *',
    'SELECT public.auto_confirm_completed_slots(3);'
);

-- 크론잡 확인
SELECT * FROM cron.job;

-- 크론잡 삭제
SELECT cron.unschedule('auto-complete-overdue-slots');
SELECT cron.unschedule('auto-confirm-completed-slots');
*/

-- ============================================
-- 함수 삭제 쿼리
-- ============================================
/*
DROP FUNCTION IF EXISTS public.auto_complete_overdue_slots(INT);
DROP FUNCTION IF EXISTS public.auto_confirm_completed_slots(INT);
*/