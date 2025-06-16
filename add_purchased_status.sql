-- 보장형 슬롯 견적 요청 테이블에 'purchased' 상태 추가
ALTER TABLE guarantee_slot_requests 
DROP CONSTRAINT IF EXISTS request_status_check;

ALTER TABLE guarantee_slot_requests 
ADD CONSTRAINT request_status_check 
CHECK (status IN ('requested', 'negotiating', 'accepted', 'rejected', 'expired', 'purchased'));

-- 인덱스 재생성 (상태 추가로 인한)
REINDEX INDEX idx_guarantee_requests_status;

COMMENT ON COLUMN guarantee_slot_requests.status IS 'requested: 요청됨, negotiating: 협상중, accepted: 협상완료, rejected: 거절됨, expired: 만료됨, purchased: 구매완료';