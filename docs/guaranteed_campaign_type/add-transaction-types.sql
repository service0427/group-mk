-- guarantee_slot_transactions 테이블의 transaction_type 제약 조건 수정
-- 'approval'과 'rejection' 타입 추가

-- 기존 제약 조건 제거
ALTER TABLE guarantee_slot_transactions DROP CONSTRAINT IF EXISTS transaction_type_check;

-- 새로운 제약 조건 추가 (approval, rejection 포함)
ALTER TABLE guarantee_slot_transactions ADD CONSTRAINT transaction_type_check 
CHECK (transaction_type IN ('purchase', 'settlement', 'refund', 'cancellation', 'approval', 'rejection'));