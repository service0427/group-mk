-- 재협상 요청 메시지 타입 추가
-- 작성일: 2025-06-21

-- 기존 제약조건 삭제
ALTER TABLE public.guarantee_slot_negotiations 
DROP CONSTRAINT IF EXISTS message_type_check;

-- 새로운 제약조건 추가 (renegotiation_request 포함)
ALTER TABLE public.guarantee_slot_negotiations
ADD CONSTRAINT message_type_check 
CHECK (message_type IN ('message', 'price_proposal', 'counter_offer', 'acceptance', 'renegotiation_request'));

-- 코멘트 업데이트
COMMENT ON COLUMN guarantee_slot_negotiations.message_type IS '메시지 타입 (message: 일반 메시지, price_proposal: 가격 제안, counter_offer: 역제안, acceptance: 수락, renegotiation_request: 재협상 요청)';