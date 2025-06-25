-- ============================================
-- 슬롯 생성 시 자동으로 slot_pending_balances 생성하는 트리거
-- ============================================
-- 슬롯이 생성될 때마다 자동으로 pending balance를 생성
-- 스프레드시트 모드에서도 각 슬롯(행)마다 개별 생성
-- ============================================

-- 1. 슬롯 생성 시 slot_pending_balances 자동 생성 함수
CREATE OR REPLACE FUNCTION create_slot_pending_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign RECORD;
    v_total_days INTEGER;
    v_amount NUMERIC;
BEGIN
    -- 새로운 슬롯이 생성되고 상태가 'pending'인 경우에 처리
    -- (슬롯 구매 시 pending 상태로 생성됨)
    IF NEW.status = 'pending' THEN
        -- 캠페인 정보 조회
        SELECT * INTO v_campaign
        FROM campaigns
        WHERE id = NEW.product_id;
        
        -- 작업 일수 계산
        IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
            v_total_days := (NEW.end_date - NEW.start_date + 1);
        ELSE
            v_total_days := 1; -- 기본값
        END IF;
        
        -- 금액 계산: 단가 × 수량 × 일수
        v_amount := v_campaign.unit_price * COALESCE(NEW.quantity, 1) * v_total_days;
        
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
            format('슬롯 생성 - %s (수량: %s, 기간: %s일)', 
                v_campaign.campaign_name, 
                COALESCE(NEW.quantity, 1),
                v_total_days
            ),
            NOW()
        )
        ON CONFLICT (slot_id) DO NOTHING; -- 중복 방지
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS create_pending_balance_on_slot_insert ON slots;

CREATE TRIGGER create_pending_balance_on_slot_insert
AFTER INSERT ON slots
FOR EACH ROW
EXECUTE FUNCTION create_slot_pending_balance();

-- 3. UPDATE 트리거는 필요 없음
-- 소스 코드에서 이미 slot_pending_balances의 status를 UPDATE하고 있음:
-- - 총판 승인 시: TypeScript에서 'approved'로 UPDATE
-- - 총판 작업 완료 시: SQL 함수에서 'approved'로 UPDATE  
-- - 사용자 거래 완료 시: SQL 함수에서 'processed'로 UPDATE
-- - 환불 시: TypeScript에서 'refund' 또는 'rejected'로 UPDATE

-- 4. 기존 슬롯 중 pending_balance가 없는 것들 처리
-- 실행 전 확인용 쿼리 (모든 상태 포함)
WITH missing_pending_balances AS (
    SELECT 
        s.id as slot_id,
        s.user_id,
        s.product_id,
        s.quantity,
        s.start_date,
        s.end_date,
        s.status as slot_status,
        c.campaign_name,
        c.unit_price,
        CASE 
            WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL 
            THEN (s.end_date - s.start_date + 1)
            ELSE 1
        END as total_days,
        c.unit_price * COALESCE(s.quantity, 1) * 
        CASE 
            WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL 
            THEN (s.end_date - s.start_date + 1)
            ELSE 1
        END as amount,
        -- 복구될 pending_balance 상태 미리보기
        CASE 
            WHEN s.status = 'pending' THEN 'pending'
            WHEN s.status = 'approved' THEN 'pending'
            WHEN s.status = 'pending_user_confirm' THEN 'approved'
            WHEN s.status = 'completed' THEN 'processed'
            WHEN s.status = 'refund' THEN 'refund'
            WHEN s.status = 'rejected' THEN 'rejected'
            ELSE 'pending'
        END as pending_balance_status
    FROM slots s
    JOIN campaigns c ON c.id = s.product_id
    LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
    WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund', 'rejected')
      AND spb.id IS NULL
)
SELECT 
    slot_id,
    user_id,
    campaign_name,
    quantity,
    total_days,
    amount,
    slot_status,
    pending_balance_status as "복구될_상태"
FROM missing_pending_balances
ORDER BY slot_status, slot_id;

-- 5. 누락된 pending_balance 일괄 생성 (위 SELECT 확인 후 실행)
-- 슬롯 상태에 따라 적절한 pending_balance 상태로 복구
-- INSERT INTO slot_pending_balances (
--     slot_id,
--     user_id,
--     product_id,
--     amount,
--     status,
--     notes,
--     created_at,
--     processed_at
-- )
-- SELECT 
--     s.id as slot_id,
--     s.user_id,
--     s.product_id,
--     c.unit_price * COALESCE(s.quantity, 1) * 
--     CASE 
--         WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL 
--         THEN (s.end_date - s.start_date + 1)
--         ELSE 1
--     END as amount,
--     -- 슬롯 상태에 따른 적절한 pending_balance 상태 설정
--     CASE 
--         WHEN s.status = 'pending' THEN 'pending'
--         WHEN s.status = 'approved' THEN 'pending'  -- 아직 총판이 작업 완료 전
--         WHEN s.status = 'pending_user_confirm' THEN 'approved'  -- 총판 작업 완료
--         WHEN s.status = 'completed' THEN 'processed'  -- 사용자 거래 완료
--         WHEN s.status = 'refund' THEN 'refund'
--         WHEN s.status = 'rejected' THEN 'rejected'
--         ELSE 'pending'
--     END as status,
--     format('시스템 복구 - 누락된 pending balance 생성 (슬롯 상태: %s)', s.status),
--     NOW() as created_at,
--     -- 완료된 상태들은 processed_at도 설정
--     CASE 
--         WHEN s.status IN ('completed', 'refund', 'rejected') THEN NOW()
--         ELSE NULL
--     END as processed_at
-- FROM slots s
-- JOIN campaigns c ON c.id = s.product_id
-- LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
-- WHERE s.status IN ('pending', 'approved', 'pending_user_confirm', 'completed', 'refund', 'rejected')
--   AND spb.id IS NULL;

-- ============================================
-- 테스트 및 롤백 쿼리
-- ============================================

-- 6. 트리거 작동 테스트
-- 테스트용 슬롯 생성 (실제 테스트 시 user_id, mat_id, product_id를 실제 값으로 변경)
/*
INSERT INTO slots (
    user_id,
    mat_id,
    product_id,
    status,
    quantity,
    start_date,
    end_date,
    input_data,
    created_at
) VALUES (
    'YOUR_USER_ID'::UUID,
    'YOUR_MAT_ID'::UUID,
    1, -- 실제 캠페인 ID로 변경
    'pending',
    10,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    '{"test": true}'::jsonb,
    NOW()
) RETURNING id;

-- 생성된 슬롯의 pending_balance 확인
SELECT * FROM slot_pending_balances 
WHERE slot_id = 'CREATED_SLOT_ID';
*/

-- 7. 트리거 작동 확인 쿼리
-- 최근 생성된 슬롯과 pending_balance 매칭 확인
SELECT 
    s.id as slot_id,
    s.status as slot_status,
    s.created_at as slot_created,
    spb.id as pending_balance_id,
    spb.status as pending_status,
    spb.amount,
    spb.created_at as pending_created
FROM slots s
LEFT JOIN slot_pending_balances spb ON spb.slot_id = s.id
WHERE s.created_at > NOW() - INTERVAL '1 hour'
ORDER BY s.created_at DESC;

-- 8. 문제 발생 시 트리거 삭제
/*
-- INSERT 트리거 삭제
DROP TRIGGER IF EXISTS create_pending_balance_on_slot_insert ON slots;
DROP FUNCTION IF EXISTS create_slot_pending_balance();

-- 트리거 삭제 확인
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text = 'slots';
*/

-- 9. 트리거 상태 확인
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text = 'slots'
  AND tgname LIKE '%pending_balance%';

-- 10. 디버깅용 - 트리거 함수 내용 확인
/*
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_slot_pending_balance';
*/