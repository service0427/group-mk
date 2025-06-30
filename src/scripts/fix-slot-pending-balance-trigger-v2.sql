-- ============================================
-- 슬롯 생성 시 slot_pending_balances 트리거 수정
-- VAT 포함 및 input_data의 work_days 필드 인식
-- ============================================

-- 1. 개선된 슬롯 생성 시 slot_pending_balances 자동 생성 함수
CREATE OR REPLACE FUNCTION create_slot_pending_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign RECORD;
    v_total_days INTEGER;
    v_amount NUMERIC;
    v_unit_price NUMERIC;
    v_quantity INTEGER;
    v_work_days INTEGER;
BEGIN
    -- 새로운 슬롯이 생성되고 상태가 'pending'인 경우에만 처리
    IF NEW.status = 'pending' THEN
        -- 캠페인 정보 조회
        SELECT * INTO v_campaign
        FROM campaigns
        WHERE id = NEW.product_id;
        
        -- 수량 설정
        v_quantity := COALESCE(NEW.quantity, 1);
        
        -- 캠페인이 없는 경우 처리 중단
        IF v_campaign.id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- 작업 일수 계산 (input_data에서 우선 확인)
        v_work_days := NULL;
        
        -- input_data에서 work_days 확인 (여러 필드명 체크)
        IF NEW.input_data IS NOT NULL THEN
            -- work_days 필드 확인
            IF NEW.input_data ? 'work_days' THEN
                v_work_days := (NEW.input_data->>'work_days')::INTEGER;
            -- dueDays 필드 확인
            ELSIF NEW.input_data ? 'dueDays' THEN
                v_work_days := (NEW.input_data->>'dueDays')::INTEGER;
            -- workDays 필드 확인
            ELSIF NEW.input_data ? 'workDays' THEN
                v_work_days := (NEW.input_data->>'workDays')::INTEGER;
            END IF;
        END IF;
        
        -- work_days가 여전히 NULL이거나 0 이하면 날짜로 계산
        IF v_work_days IS NULL OR v_work_days <= 0 THEN
            IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
                v_total_days := (NEW.end_date - NEW.start_date)::INTEGER + 1;
            ELSE
                v_total_days := 1; -- 기본값
            END IF;
        ELSE
            v_total_days := v_work_days;
        END IF;
        
        -- 단가 설정
        v_unit_price := COALESCE(v_campaign.unit_price, 0);
        
        -- 금액 계산: 단가 × 수량 × 일수 × 1.1 (VAT 10% 포함)
        v_amount := CEIL(v_unit_price * v_quantity * v_total_days * 1.1);
        
        -- slot_pending_balances에 레코드 생성
        INSERT INTO slot_pending_balances (
            slot_id,
            user_id,
            product_id,
            amount,
            status,
            notes,
            created_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.product_id,
            v_amount,
            'pending', -- 초기 상태는 pending
            jsonb_build_object(
                'description', format('슬롯 생성 - %s (수량: %s, 기간: %s일)', 
                    v_campaign.campaign_name, 
                    v_quantity,
                    v_total_days
                ),
                'calculation', jsonb_build_object(
                    'unit_price', v_unit_price,
                    'quantity', v_quantity,
                    'days', v_total_days,
                    'vat_rate', 0.1,
                    'total_before_vat', v_unit_price * v_quantity * v_total_days,
                    'vat_amount', CEIL(v_unit_price * v_quantity * v_total_days * 0.1),
                    'total_with_vat', v_amount
                ),
                'work_days_source', CASE 
                    WHEN v_work_days IS NOT NULL THEN 'input_data'
                    WHEN NEW.start_date IS NOT NULL THEN 'date_calculation'
                    ELSE 'default'
                END
            )::text,
            NOW()
        )
        ON CONFLICT (slot_id) DO UPDATE SET
            amount = EXCLUDED.amount,
            notes = EXCLUDED.notes
        WHERE slot_pending_balances.amount != EXCLUDED.amount; -- 금액이 다른 경우에만 업데이트
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 재생성 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS create_pending_balance_on_slot_insert ON slots;

CREATE TRIGGER create_pending_balance_on_slot_insert
AFTER INSERT ON slots
FOR EACH ROW
EXECUTE FUNCTION create_slot_pending_balance();

-- 3. 트리거 함수가 올바르게 생성되었는지 확인
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'create_slot_pending_balance';

-- 4. 기존 잘못된 데이터 확인 쿼리
-- 실제 지불 금액과 pending_balance 금액이 다른 슬롯 찾기
WITH slot_calculation AS (
    SELECT 
        s.id as slot_id,
        s.user_id,
        s.product_id,
        s.quantity,
        s.input_data,
        s.status as slot_status,
        c.campaign_name,
        c.unit_price,
        -- input_data에서 work_days 추출
        CASE 
            WHEN s.input_data->>'work_days' IS NOT NULL THEN (s.input_data->>'work_days')::INTEGER
            WHEN s.input_data->>'dueDays' IS NOT NULL THEN (s.input_data->>'dueDays')::INTEGER
            WHEN s.input_data->>'workDays' IS NOT NULL THEN (s.input_data->>'workDays')::INTEGER
            WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN (s.end_date - s.start_date)::INTEGER + 1
            ELSE 1
        END as calculated_days,
        -- 실제 지불해야 할 금액 (VAT 포함)
        CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
            CASE 
                WHEN s.input_data->>'work_days' IS NOT NULL THEN (s.input_data->>'work_days')::INTEGER
                WHEN s.input_data->>'dueDays' IS NOT NULL THEN (s.input_data->>'dueDays')::INTEGER
                WHEN s.input_data->>'workDays' IS NOT NULL THEN (s.input_data->>'workDays')::INTEGER
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN (s.end_date - s.start_date)::INTEGER + 1
                ELSE 1
            END * 1.1
        ) as correct_amount,
        -- 현재 pending_balance 금액
        spb.amount as current_amount,
        spb.status as pending_status
    FROM slots s
    JOIN campaigns c ON c.id = s.product_id
    LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
    WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund')
)
SELECT 
    slot_id,
    campaign_name,
    quantity,
    calculated_days as "계산된_작업일",
    correct_amount as "정확한_금액",
    current_amount as "현재_금액",
    correct_amount - COALESCE(current_amount, 0) as "차액",
    slot_status,
    pending_status
FROM slot_calculation
WHERE correct_amount != COALESCE(current_amount, 0)
ORDER BY ABS(correct_amount - COALESCE(current_amount, 0)) DESC;

-- 5. 특정 슬롯 상세 확인 (문제가 된 슬롯 ID로 확인)
SELECT 
    s.id,
    s.input_data,
    s.quantity,
    s.start_date,
    s.end_date,
    c.unit_price,
    c.campaign_name,
    spb.amount as pending_amount,
    -- 각 필드별 work_days 값
    s.input_data->>'work_days' as work_days,
    s.input_data->>'dueDays' as dueDays,
    s.input_data->>'workDays' as workDays,
    -- 계산 과정
    c.unit_price || ' × ' || COALESCE(s.quantity, 1) || ' × ' || 
    CASE 
        WHEN s.input_data->>'work_days' IS NOT NULL THEN s.input_data->>'work_days'
        WHEN s.input_data->>'dueDays' IS NOT NULL THEN s.input_data->>'dueDays'
        WHEN s.input_data->>'workDays' IS NOT NULL THEN s.input_data->>'workDays'
        ELSE '1'
    END || ' × 1.1 = ' || 
    CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
        CASE 
            WHEN s.input_data->>'work_days' IS NOT NULL THEN (s.input_data->>'work_days')::INTEGER
            WHEN s.input_data->>'dueDays' IS NOT NULL THEN (s.input_data->>'dueDays')::INTEGER
            WHEN s.input_data->>'workDays' IS NOT NULL THEN (s.input_data->>'workDays')::INTEGER
            ELSE 1
        END * 1.1
    ) as "계산식"
FROM slots s
JOIN campaigns c ON c.id = s.product_id
LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
WHERE s.id = '6d6d120f-a5df-4e90-8893-e1dfc84e1332'; -- 문제가 된 슬롯 ID

-- 6. 기존 잘못된 데이터 수정 (확인 후 실행)
-- UPDATE slot_pending_balances spb
-- SET 
--     amount = sub.correct_amount,
--     notes = jsonb_build_object(
--         'description', format('시스템 수정 - 금액 보정 (기존: %s, 수정: %s)', spb.amount, sub.correct_amount),
--         'original_amount', spb.amount,
--         'corrected_amount', sub.correct_amount,
--         'correction_date', NOW()
--     )::text,
--     updated_at = NOW()
-- FROM (
--     SELECT 
--         s.id as slot_id,
--         CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
--             CASE 
--                 WHEN s.input_data->>'work_days' IS NOT NULL THEN (s.input_data->>'work_days')::INTEGER
--                 WHEN s.input_data->>'dueDays' IS NOT NULL THEN (s.input_data->>'dueDays')::INTEGER
--                 WHEN s.input_data->>'workDays' IS NOT NULL THEN (s.input_data->>'workDays')::INTEGER
--                 WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN (s.end_date - s.start_date)::INTEGER + 1
--                 ELSE 1
--             END * 1.1
--         ) as correct_amount
--     FROM slots s
--     JOIN campaigns c ON c.id = s.product_id
--     WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund')
-- ) sub
-- WHERE spb.slot_id = sub.slot_id
--   AND spb.amount != sub.correct_amount;

-- 7. 트리거 작동 확인
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_slot_pending_balance'
  AND routine_schema = 'public';