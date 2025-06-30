-- ============================================
-- 기존 잘못된 슬롯 데이터 수정 스크립트
-- 1. slot_pending_balances 금액 수정 (VAT 포함)
-- 2. 슬롯 날짜 수정 (work_days 기반)
-- 3. 처리되지 않은 환불 처리
-- ============================================

-- 1. 문제가 된 특정 슬롯 상세 확인
SELECT 
    s.id,
    s.status,
    s.input_data,
    s.quantity,
    s.start_date,
    s.end_date,
    s.user_id,
    c.unit_price,
    c.campaign_name,
    spb.amount as current_pending_amount,
    spb.status as pending_status,
    -- work_days 추출
    COALESCE(
        (s.input_data->>'work_days')::INTEGER,
        (s.input_data->>'dueDays')::INTEGER,
        (s.input_data->>'workDays')::INTEGER,
        1
    ) as work_days,
    -- 정확한 금액 계산 (VAT 포함)
    CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
        COALESCE(
            (s.input_data->>'work_days')::INTEGER,
            (s.input_data->>'dueDays')::INTEGER,
            (s.input_data->>'workDays')::INTEGER,
            1
        ) * 1.1
    ) as correct_amount,
    -- 사용자 잔액 확인
    ub.amount as user_balance
FROM slots s
JOIN campaigns c ON c.id = s.product_id
LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
LEFT JOIN user_balances ub ON ub.user_id = s.user_id
WHERE s.id = '6d6d120f-a5df-4e90-8893-e1dfc84e1332';

-- 2. 잘못된 금액의 slot_pending_balances 찾기
WITH incorrect_balances AS (
    SELECT 
        s.id as slot_id,
        s.user_id,
        s.status as slot_status,
        c.campaign_name,
        c.unit_price,
        COALESCE(s.quantity, 1) as quantity,
        -- work_days 계산
        COALESCE(
            (s.input_data->>'work_days')::INTEGER,
            (s.input_data->>'dueDays')::INTEGER,
            (s.input_data->>'workDays')::INTEGER,
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL 
                THEN (s.end_date - s.start_date)::INTEGER + 1
                ELSE 1
            END
        ) as work_days,
        -- 현재 금액
        spb.amount as current_amount,
        spb.status as pending_status,
        -- 정확한 금액 (VAT 포함)
        CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
            COALESCE(
                (s.input_data->>'work_days')::INTEGER,
                (s.input_data->>'dueDays')::INTEGER,
                (s.input_data->>'workDays')::INTEGER,
                CASE 
                    WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL 
                    THEN (s.end_date - s.start_date)::INTEGER + 1
                    ELSE 1
                END
            ) * 1.1
        ) as correct_amount
    FROM slots s
    JOIN campaigns c ON c.id = s.product_id
    JOIN slot_pending_balances spb ON spb.slot_id = s.id
    WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund')
)
SELECT 
    slot_id,
    slot_status,
    campaign_name,
    quantity || ' × ' || unit_price || ' × ' || work_days || ' × 1.1' as "계산식",
    current_amount as "현재금액",
    correct_amount as "정확한금액",
    correct_amount - current_amount as "차액",
    pending_status
FROM incorrect_balances
WHERE current_amount != correct_amount
ORDER BY ABS(correct_amount - current_amount) DESC
LIMIT 20;

-- 3. slot_pending_balances 금액 수정
UPDATE slot_pending_balances spb
SET 
    amount = sub.correct_amount,
    notes = COALESCE(spb.notes::jsonb, '{}'::jsonb) || jsonb_build_object(
        'correction_history', jsonb_build_array(
            jsonb_build_object(
                'date', NOW(),
                'action', '시스템 금액 보정',
                'old_amount', spb.amount,
                'new_amount', sub.correct_amount,
                'reason', 'VAT 미포함 및 work_days 미인식 오류 수정'
            )
        )
    )::text
FROM (
    SELECT 
        s.id as slot_id,
        CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
            COALESCE(
                (s.input_data->>'work_days')::INTEGER,
                (s.input_data->>'dueDays')::INTEGER,
                (s.input_data->>'workDays')::INTEGER,
                CASE 
                    WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL 
                    THEN (s.end_date - s.start_date)::INTEGER + 1
                    ELSE 1
                END
            ) * 1.1
        ) as correct_amount
    FROM slots s
    JOIN campaigns c ON c.id = s.product_id
    WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund')
) sub
WHERE spb.slot_id = sub.slot_id
  AND spb.amount != sub.correct_amount;

-- 4. 슬롯 날짜 수정 (work_days 기반)
UPDATE slots
SET 
    start_date = CASE 
        WHEN start_date IS NULL THEN CURRENT_DATE
        ELSE start_date
    END,
    end_date = CASE 
        WHEN start_date IS NULL THEN 
            CURRENT_DATE + INTERVAL '1 day' * (
                COALESCE(
                    (input_data->>'work_days')::INTEGER,
                    (input_data->>'dueDays')::INTEGER,
                    (input_data->>'workDays')::INTEGER,
                    1
                ) - 1
            )
        ELSE 
            start_date + INTERVAL '1 day' * (
                COALESCE(
                    (input_data->>'work_days')::INTEGER,
                    (input_data->>'dueDays')::INTEGER,
                    (input_data->>'workDays')::INTEGER,
                    1
                ) - 1
            )
    END,
    updated_at = NOW()
WHERE status IN ('approved', 'pending_user_confirm', 'completed')
  AND (
    -- 날짜가 NULL이거나
    start_date IS NULL OR end_date IS NULL OR
    -- 날짜 차이가 work_days와 맞지 않는 경우
    (end_date - start_date + 1) != COALESCE(
        (input_data->>'work_days')::INTEGER,
        (input_data->>'dueDays')::INTEGER,
        (input_data->>'workDays')::INTEGER,
        1
    )
  );

-- 5. 환불 처리되지 않은 슬롯 찾기
WITH unprocessed_refunds AS (
    SELECT 
        s.id as slot_id,
        s.user_id,
        s.status,
        spb.amount,
        spb.status as pending_status,
        c.campaign_name,
        -- 환불 기록 확인
        EXISTS(
            SELECT 1 FROM user_cash_history uch
            WHERE uch.user_id = s.user_id
              AND uch.transaction_type = 'refund'
              AND uch.description LIKE '%' || s.id || '%'
        ) as has_refund_record
    FROM slots s
    JOIN slot_pending_balances spb ON spb.slot_id = s.id
    JOIN campaigns c ON c.id = s.product_id
    WHERE s.status = 'refund'
      AND spb.status IN ('pending', 'approved', 'processed') -- refund 상태가 아닌 경우
)
SELECT 
    slot_id,
    user_id,
    campaign_name,
    amount as "환불금액",
    has_refund_record as "환불기록존재"
FROM unprocessed_refunds
WHERE NOT has_refund_record; -- 환불 기록이 없는 경우만

-- 6. 환불 처리 (특정 슬롯)
-- 주의: 이 쿼리는 수동으로 실행해야 합니다
/*
DO $$
DECLARE
    v_slot_id UUID := '6d6d120f-a5df-4e90-8893-e1dfc84e1332';
    v_user_id UUID;
    v_amount NUMERIC;
    v_campaign_name TEXT;
BEGIN
    -- 슬롯 정보 조회
    SELECT 
        s.user_id,
        spb.amount,
        c.campaign_name
    INTO v_user_id, v_amount, v_campaign_name
    FROM slots s
    JOIN slot_pending_balances spb ON spb.slot_id = s.id
    JOIN campaigns c ON c.id = s.product_id
    WHERE s.id = v_slot_id;
    
    -- slot_pending_balances 상태 업데이트
    UPDATE slot_pending_balances
    SET 
        status = 'refund',
        processed_at = NOW(),
        notes = COALESCE(notes::jsonb, '{}'::jsonb) || jsonb_build_object(
            'refund_process', jsonb_build_object(
                'date', NOW(),
                'action', '시스템 환불 처리',
                'amount', v_amount
            )
        )::text
    WHERE slot_id = v_slot_id;
    
    -- user_balances 업데이트
    UPDATE user_balances
    SET 
        amount = amount + v_amount,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
    -- user_cash_history 추가
    INSERT INTO user_cash_history (
        user_id,
        amount,
        transaction_type,
        description,
        status,
        created_at
    ) VALUES (
        v_user_id,
        v_amount,
        'refund',
        format('슬롯 환불 - %s (ID: %s)', v_campaign_name, v_slot_id),
        'completed',
        NOW()
    );
    
    RAISE NOTICE '환불 처리 완료: 슬롯 ID %, 금액 %', v_slot_id, v_amount;
END $$;
*/

-- 7. 수정 결과 확인
-- 특정 슬롯의 수정 후 상태
SELECT 
    s.id,
    s.status,
    s.start_date,
    s.end_date,
    (s.end_date - s.start_date + 1) as calculated_days,
    s.input_data->>'work_days' as work_days,
    spb.amount as pending_amount,
    spb.status as pending_status,
    ub.amount as user_balance
FROM slots s
LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
LEFT JOIN user_balances ub ON ub.user_id = s.user_id
WHERE s.id = '6d6d120f-a5df-4e90-8893-e1dfc84e1332';

-- 8. 전체 수정 통계
SELECT 
    COUNT(*) FILTER (WHERE spb.amount != sub.correct_amount) as "금액수정필요",
    COUNT(*) FILTER (WHERE s.start_date IS NULL OR s.end_date IS NULL) as "날짜수정필요",
    COUNT(*) FILTER (WHERE s.status = 'refund' AND spb.status != 'refund') as "환불처리필요"
FROM slots s
JOIN campaigns c ON c.id = s.product_id
LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
LEFT JOIN LATERAL (
    SELECT 
        s.id as slot_id,
        CEIL(c.unit_price * COALESCE(s.quantity, 1) * 
            COALESCE(
                (s.input_data->>'work_days')::INTEGER,
                (s.input_data->>'dueDays')::INTEGER,
                (s.input_data->>'workDays')::INTEGER,
                1
            ) * 1.1
        ) as correct_amount
) sub ON sub.slot_id = s.id
WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund');