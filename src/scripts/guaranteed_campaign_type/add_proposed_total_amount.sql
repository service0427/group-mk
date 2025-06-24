-- guarantee_slot_negotiations 테이블에 proposed_total_amount 컬럼 추가
ALTER TABLE public.guarantee_slot_negotiations 
ADD COLUMN IF NOT EXISTS proposed_total_amount INTEGER;

-- 기존 데이터에 대해 budget_type이 'total'인 경우 proposed_daily_amount 값을 복사
UPDATE public.guarantee_slot_negotiations
SET proposed_total_amount = proposed_daily_amount
WHERE budget_type = 'total' AND proposed_total_amount IS NULL;