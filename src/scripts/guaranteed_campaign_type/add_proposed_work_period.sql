-- guarantee_slot_negotiations 테이블에 proposed_work_period, proposed_target_rank 컬럼 추가
-- 작성일: 2025-01-24
-- 설명: 협상 시 제안된 작업기간과 목표순위를 저장하기 위한 컬럼

ALTER TABLE public.guarantee_slot_negotiations 
ADD COLUMN IF NOT EXISTS proposed_work_period INTEGER,
ADD COLUMN IF NOT EXISTS proposed_target_rank INTEGER;

COMMENT ON COLUMN public.guarantee_slot_negotiations.proposed_work_period IS '제안된 작업 기간 (일수)';
COMMENT ON COLUMN public.guarantee_slot_negotiations.proposed_target_rank IS '제안된 목표 순위';