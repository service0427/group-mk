-- guarantee_slot_requests 테이블에 budget_type 컬럼 추가
ALTER TABLE public.guarantee_slot_requests 
ADD COLUMN IF NOT EXISTS budget_type VARCHAR(10) DEFAULT 'daily' 
CHECK (budget_type IN ('daily', 'total'));

-- 기존 데이터는 모두 'daily'로 설정 (이미 기본값이 있으므로 필요 없음)
-- UPDATE public.guarantee_slot_requests SET budget_type = 'daily' WHERE budget_type IS NULL;

COMMENT ON COLUMN public.guarantee_slot_requests.budget_type IS '예산 입력 방식 (daily: 일별/회당 단가, total: 총 단가)';