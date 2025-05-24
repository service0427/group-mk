-- 슬롯 완료 처리 관련 함수들 (수수료 제외 버전)

-- 1. 슬롯의 작업 완료율 및 작업 일수 계산 함수
CREATE OR REPLACE FUNCTION calculate_slot_work_summary(p_slot_id UUID)
RETURNS TABLE (
    total_requested_days INTEGER,
    total_worked_days INTEGER,
    total_requested_quantity INTEGER,
    total_worked_quantity INTEGER,
    completion_rate NUMERIC,
    work_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH slot_info AS (
        -- 슬롯 기본 정보
        SELECT 
            s.id,
            s.quantity::INTEGER,
            s.start_date,
            s.end_date,
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    (s.end_date - s.start_date + 1)
                ELSE 0
            END as requested_days
        FROM slots s
        WHERE s.id = p_slot_id
    ),
    work_summary AS (
        -- 실제 작업 내역 집계
        SELECT 
            swi.slot_id,
            COUNT(DISTINCT swi.date) as worked_days,
            SUM(swi.work_cnt) as total_work_cnt,
            jsonb_agg(
                jsonb_build_object(
                    'date', swi.date,
                    'work_cnt', swi.work_cnt,
                    'notes', swi.notes
                ) ORDER BY swi.date
            ) as work_details
        FROM slot_works_info swi
        WHERE swi.slot_id = p_slot_id
        GROUP BY swi.slot_id
    )
    SELECT 
        si.requested_days::INTEGER as total_requested_days,
        COALESCE(ws.worked_days, 0)::INTEGER as total_worked_days,
        si.quantity::INTEGER as total_requested_quantity,
        COALESCE(ws.total_work_cnt, 0)::INTEGER as total_worked_quantity,
        CASE 
            WHEN si.quantity > 0 THEN 
                ROUND((COALESCE(ws.total_work_cnt, 0)::NUMERIC / si.quantity::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_rate,
        COALESCE(ws.work_details, '[]'::jsonb) as work_details
    FROM slot_info si
    LEFT JOIN work_summary ws ON si.id = ws.slot_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 슬롯 완료 시 정산 금액 계산 함수 (수수료 제외)
CREATE OR REPLACE FUNCTION calculate_slot_settlement(p_slot_id UUID)
RETURNS TABLE (
    slot_id UUID,
    campaign_id INTEGER,
    unit_price NUMERIC,
    total_quantity INTEGER,
    worked_quantity INTEGER,
    base_amount NUMERIC,
    user_payment_amount NUMERIC,
    refund_amount NUMERIC,
    settlement_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH slot_campaign_info AS (
        -- 슬롯과 캠페인 정보 조인
        SELECT 
            s.id as slot_id,
            s.product_id as campaign_id,
            s.quantity::INTEGER,
            s.user_id,
            s.mat_id,
            c.unit_price::NUMERIC,
            c.campaign_name,
            c.service_type
        FROM slots s
        JOIN campaigns c ON s.product_id = c.id
        WHERE s.id = p_slot_id
    ),
    work_summary AS (
        -- 작업 내역 집계
        SELECT 
            slot_id,
            SUM(work_cnt) as total_worked
        FROM slot_works_info
        WHERE slot_id = p_slot_id
        GROUP BY slot_id
    )
    SELECT 
        sci.slot_id,
        sci.campaign_id,
        sci.unit_price,
        sci.quantity as total_quantity,
        COALESCE(ws.total_worked, 0) as worked_quantity,
        sci.unit_price * sci.quantity as base_amount,
        -- 수수료 제외하고 전액 지급
        sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC as user_payment_amount,
        -- 미완료분 환불
        CASE 
            WHEN COALESCE(ws.total_worked, 0) < sci.quantity THEN
                sci.unit_price * (sci.quantity - COALESCE(ws.total_worked, 0))
            ELSE 0
        END as refund_amount,
        jsonb_build_object(
            'campaign_name', sci.campaign_name,
            'service_type', sci.service_type,
            'unit_price', sci.unit_price,
            'requested_quantity', sci.quantity,
            'completed_quantity', COALESCE(ws.total_worked, 0),
            'completion_rate', 
                CASE 
                    WHEN sci.quantity > 0 THEN 
                        ROUND((COALESCE(ws.total_worked, 0)::NUMERIC / sci.quantity::NUMERIC) * 100, 2)
                    ELSE 0
                END,
            'calculation_breakdown', jsonb_build_object(
                'total_cost', sci.unit_price * sci.quantity,
                'worked_cost', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC,
                'user_payment', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC,
                'refund', sci.unit_price * GREATEST(0, sci.quantity - COALESCE(ws.total_worked, 0))
            )
        ) as settlement_details
    FROM slot_campaign_info sci
    LEFT JOIN work_summary ws ON sci.slot_id = ws.slot_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 테스트용 간단한 버전 (실제 테이블 업데이트 없이 계산만)
CREATE OR REPLACE FUNCTION test_slot_completion(p_slot_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_work_summary RECORD;
    v_settlement RECORD;
    v_result JSONB;
BEGIN
    -- 작업 내역 요약 정보 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 정산 금액 계산
    SELECT * INTO v_settlement
    FROM calculate_slot_settlement(p_slot_id);
    
    -- 결과 반환
    v_result := jsonb_build_object(
        'slot_id', p_slot_id,
        'work_summary', row_to_json(v_work_summary),
        'settlement', row_to_json(v_settlement),
        'message', format('슬롯 완료 시뮬레이션 - 완료율: %s%%', 
            v_work_summary.completion_rate
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. 실제 슬롯 완료 처리 함수 (수수료 제외, 간소화)
CREATE OR REPLACE FUNCTION complete_slot_simple(
    p_slot_id UUID,
    p_mat_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_slot_record RECORD;
    v_settlement RECORD;
    v_work_summary RECORD;
    v_result JSONB;
    v_cash_history_id UUID;
BEGIN
    -- 트랜잭션 시작
    
    -- 1. 슬롯 정보 확인
    SELECT * INTO v_slot_record
    FROM slots
    WHERE id = p_slot_id AND mat_id = p_mat_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다. slot_id: %, mat_id: %', p_slot_id, p_mat_id;
    END IF;
    
    IF v_slot_record.status != 'approved' THEN
        RAISE EXCEPTION '승인된 슬롯만 완료 처리할 수 있습니다. 현재 상태: %', v_slot_record.status;
    END IF;
    
    -- 2. 작업 내역 요약 정보 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 3. 정산 금액 계산
    SELECT * INTO v_settlement
    FROM calculate_slot_settlement(p_slot_id);
    
    -- 4. 슬롯 상태 업데이트
    UPDATE slots
    SET 
        status = 'completed',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_slot_id;
    
    -- 5. 슬롯 히스토리 로그 추가
    INSERT INTO slot_history_logs (
        slot_id,
        user_id,
        old_status,
        new_status,
        action,
        details,
        created_at
    ) VALUES (
        p_slot_id,
        p_mat_id,
        'approved',
        'completed',
        'complete',
        jsonb_build_object(
            'work_summary', row_to_json(v_work_summary),
            'settlement', row_to_json(v_settlement),
            'notes', p_notes,
            'completed_by', 'mat'
        ),
        NOW()
    );
    
    -- 6. 사용자에게 작업 대금 지급 (user_cash_history)
    IF v_settlement.user_payment_amount > 0 THEN
        INSERT INTO user_cash_history (
            user_id,
            transaction_type,
            amount,
            description,
            reference_id,
            mat_id,
            balance_type
        ) VALUES (
            v_slot_record.user_id,
            'work',
            v_settlement.user_payment_amount,
            format('슬롯 완료 정산 - %s (%s개 완료)', 
                v_settlement.settlement_details->>'campaign_name',
                v_settlement.worked_quantity
            ),
            p_slot_id,
            p_mat_id,
            'free'
        ) RETURNING id INTO v_cash_history_id;
        
        -- user_balances 업데이트
        INSERT INTO user_balances (user_id, free_balance, total_balance)
        VALUES (v_slot_record.user_id, v_settlement.user_payment_amount, v_settlement.user_payment_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            free_balance = user_balances.free_balance + v_settlement.user_payment_amount,
            total_balance = user_balances.total_balance + v_settlement.user_payment_amount,
            updated_at = NOW();
    END IF;
    
    -- 7. 미완료 수량에 대한 환불 처리
    IF v_settlement.refund_amount > 0 THEN
        INSERT INTO user_cash_history (
            user_id,
            transaction_type,
            amount,
            description,
            reference_id,
            mat_id,
            balance_type
        ) VALUES (
            v_slot_record.user_id,
            'refund',
            v_settlement.refund_amount,
            format('슬롯 미완료 환불 - %s (%s개 미완료)', 
                v_settlement.settlement_details->>'campaign_name',
                v_settlement.total_quantity - v_settlement.worked_quantity
            ),
            p_slot_id,
            p_mat_id,
            'paid'
        );
        
        -- user_balances 업데이트
        INSERT INTO user_balances (user_id, paid_balance, total_balance)
        VALUES (v_slot_record.user_id, v_settlement.refund_amount, v_settlement.refund_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            paid_balance = user_balances.paid_balance + v_settlement.refund_amount,
            total_balance = user_balances.total_balance + v_settlement.refund_amount,
            updated_at = NOW();
    END IF;
    
    -- 8. 감사 로그 기록
    INSERT INTO balance_audit_log (
        user_id,
        change_type,
        old_paid_balance,
        new_paid_balance,
        old_free_balance,
        new_free_balance,
        change_amount,
        details
    )
    SELECT 
        v_slot_record.user_id,
        'slot_completion',
        COALESCE(ub.paid_balance, 0) - COALESCE(v_settlement.refund_amount, 0),
        COALESCE(ub.paid_balance, 0),
        COALESCE(ub.free_balance, 0) - COALESCE(v_settlement.user_payment_amount, 0),
        COALESCE(ub.free_balance, 0),
        COALESCE(v_settlement.user_payment_amount, 0) + COALESCE(v_settlement.refund_amount, 0),
        jsonb_build_object(
            'slot_id', p_slot_id,
            'user_payment', v_settlement.user_payment_amount,
            'refund', v_settlement.refund_amount,
            'work_summary', row_to_json(v_work_summary)
        )
    FROM user_balances ub
    WHERE ub.user_id = v_slot_record.user_id;
    
    -- 9. 결과 반환
    v_result := jsonb_build_object(
        'success', true,
        'slot_id', p_slot_id,
        'status', 'completed',
        'work_summary', row_to_json(v_work_summary),
        'settlement', row_to_json(v_settlement),
        'message', format('슬롯이 성공적으로 완료되었습니다. 완료율: %s%%', 
            v_work_summary.completion_rate
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 롤백
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- ===== 테스트 쿼리 예시 =====

-- 1. 작업 요약만 조회 (읽기 전용)
-- SELECT * FROM calculate_slot_work_summary('슬롯ID');

-- 2. 정산 금액만 계산 (읽기 전용)
-- SELECT * FROM calculate_slot_settlement('슬롯ID');

-- 3. 전체 시뮬레이션 (데이터 변경 없음)
-- SELECT test_slot_completion('슬롯ID');

-- 4. 실제 완료 처리 (데이터 변경됨)
-- SELECT complete_slot_simple('슬롯ID', '총판ID', '완료 메모');


-- ===== 함수 삭제 쿼리 (필요시 사용) =====
-- 주의: 아래 쿼리들은 생성한 함수를 삭제합니다. 필요한 경우에만 주석을 해제하여 사용하세요.

-- 1. 작업 요약 계산 함수 삭제
-- DROP FUNCTION IF EXISTS calculate_slot_work_summary(UUID);

-- 2. 정산 금액 계산 함수 삭제
-- DROP FUNCTION IF EXISTS calculate_slot_settlement(UUID);

-- 3. 테스트용 시뮬레이션 함수 삭제
-- DROP FUNCTION IF EXISTS test_slot_completion(UUID);

-- 4. 실제 완료 처리 함수 삭제
-- DROP FUNCTION IF EXISTS complete_slot_simple(UUID, UUID, TEXT);

-- 모든 함수 한번에 삭제 (위험! 신중히 사용)
/*
DROP FUNCTION IF EXISTS calculate_slot_work_summary(UUID);
DROP FUNCTION IF EXISTS calculate_slot_settlement(UUID);
DROP FUNCTION IF EXISTS test_slot_completion(UUID);
DROP FUNCTION IF EXISTS complete_slot_simple(UUID, UUID, TEXT);
*/

-- ===== 함수 존재 여부 확인 쿼리 =====
-- 현재 생성된 함수들을 확인하려면 아래 쿼리 사용
/*
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
    'calculate_slot_work_summary',
    'calculate_slot_settlement',
    'test_slot_completion',
    'complete_slot_simple'
)
ORDER BY proname;
*/