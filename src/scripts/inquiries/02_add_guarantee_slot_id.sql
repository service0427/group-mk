-- =============================================================================
-- 보장형 슬롯을 위한 inquiries 테이블 수정
-- 작성일: 2025-01-20
-- 설명: inquiries 테이블에 guarantee_slot_id 컬럼 추가
-- =============================================================================

-- guarantee_slot_id 컬럼 추가
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS guarantee_slot_id UUID REFERENCES guarantee_slots(id) ON DELETE CASCADE;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_guarantee_slot_id ON inquiries(guarantee_slot_id);

-- 코멘트 추가
COMMENT ON COLUMN inquiries.guarantee_slot_id IS '보장형 슬롯 ID (guarantee_slots 테이블 참조)';

-- slot_id 제약 조건 완화 (보장형 슬롯의 경우 slot_id가 null일 수 있음)
-- 기존 NOT NULL 제약이 있다면 제거
ALTER TABLE inquiries ALTER COLUMN slot_id DROP NOT NULL;

-- CHECK 제약 조건 추가: slot_id 또는 guarantee_slot_id 중 하나는 반드시 있어야 함
ALTER TABLE inquiries 
ADD CONSTRAINT check_slot_reference 
CHECK (slot_id IS NOT NULL OR guarantee_slot_id IS NOT NULL);