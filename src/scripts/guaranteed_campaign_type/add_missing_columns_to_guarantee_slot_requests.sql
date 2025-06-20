-- guarantee_slot_requests 테이블에 누락된 컬럼 추가
ALTER TABLE guarantee_slot_requests 
ADD COLUMN IF NOT EXISTS user_reason TEXT,
ADD COLUMN IF NOT EXISTS additional_requirements TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER;

-- guarantee_slots 테이블에도 동일한 컬럼 추가 (일관성 유지)
ALTER TABLE guarantee_slots 
ADD COLUMN IF NOT EXISTS user_reason TEXT,
ADD COLUMN IF NOT EXISTS additional_requirements TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_guarantee_slot_requests_status_created 
ON guarantee_slot_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guarantee_slots_status_created 
ON guarantee_slots(status, created_at DESC);

-- 추가된 컬럼 확인 쿼리
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'guarantee_slot_requests' 
-- AND column_name IN ('user_reason', 'additional_requirements', 'quantity');