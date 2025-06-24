-- guarantee_slot_requests 테이블에 guarantee_period 컬럼 추가
ALTER TABLE public.guarantee_slot_requests 
ADD COLUMN IF NOT EXISTS guarantee_period INTEGER;

-- 기존 데이터에 대해 guarantee_count와 동일한 값으로 설정 (기본값)
UPDATE public.guarantee_slot_requests
SET guarantee_period = guarantee_count
WHERE guarantee_period IS NULL;

COMMENT ON COLUMN public.guarantee_slot_requests.guarantee_period IS '작업기간 (일/회)';

-- 인덱스 추가 (필요시)
CREATE INDEX IF NOT EXISTS idx_guarantee_slot_requests_guarantee_period 
ON public.guarantee_slot_requests(guarantee_period);