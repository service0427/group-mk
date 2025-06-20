-- guarantee_slot_negotiations 테이블의 message_type_check 제약 조건 업데이트
-- 'acceptance' 타입 추가

-- 1. 기존 제약 조건 삭제
ALTER TABLE guarantee_slot_negotiations 
DROP CONSTRAINT IF EXISTS message_type_check;

-- 2. 새로운 제약 조건 추가 (acceptance 포함)
ALTER TABLE guarantee_slot_negotiations 
ADD CONSTRAINT message_type_check 
CHECK (message_type IN ('message', 'price_proposal', 'counter_offer', 'acceptance'));

-- 3. 변경 사항 확인
-- SELECT conname, contype, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'message_type_check';