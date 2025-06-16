-- 협상 메시지 테이블에 제안된 보장 횟수/일수 컬럼 추가
ALTER TABLE guarantee_slot_negotiations 
ADD COLUMN IF NOT EXISTS proposed_guarantee_count INTEGER;

-- 컬럼 설명 추가
COMMENT ON COLUMN guarantee_slot_negotiations.proposed_guarantee_count IS '제안된 보장 횟수/일수 (price_proposal인 경우)';

-- 기존 스키마 파일에도 반영
-- proposed_guarantee_count INTEGER, -- 제안 보장 횟수/일수 (price_proposal인 경우)