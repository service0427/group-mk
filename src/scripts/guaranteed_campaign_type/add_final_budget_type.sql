-- guarantee_slot_requests 테이블에 final_budget_type 컬럼 추가
ALTER TABLE public.guarantee_slot_requests 
ADD COLUMN IF NOT EXISTS final_budget_type VARCHAR(10) DEFAULT 'daily' 
CHECK (final_budget_type IN ('daily', 'total'));

-- final_total_amount 컬럼 추가 (총액으로 협상 완료된 경우 사용)
ALTER TABLE public.guarantee_slot_requests 
ADD COLUMN IF NOT EXISTS final_total_amount INTEGER;

COMMENT ON COLUMN public.guarantee_slot_requests.final_budget_type IS '최종 협상 금액 타입 (daily: 일별/회별, total: 총액)';
COMMENT ON COLUMN public.guarantee_slot_requests.final_total_amount IS '최종 총액 (final_budget_type이 total인 경우)';

-- guarantee_slot_negotiations 테이블에도 budget_type 추가
ALTER TABLE public.guarantee_slot_negotiations 
ADD COLUMN IF NOT EXISTS budget_type VARCHAR(10) DEFAULT 'daily' 
CHECK (budget_type IN ('daily', 'total'));

COMMENT ON COLUMN public.guarantee_slot_negotiations.budget_type IS '제안 금액 타입 (daily: 일별/회별, total: 총액)';