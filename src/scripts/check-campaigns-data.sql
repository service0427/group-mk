-- campaigns 테이블의 데이터 확인
SELECT 
  id,
  campaign_name,
  service_type,
  status,
  created_at,
  mat_id,
  unit_price,
  min_quantity
FROM campaigns
ORDER BY created_at DESC
LIMIT 20;

-- service_type별 캠페인 개수 확인
SELECT 
  service_type,
  COUNT(*) as count
FROM campaigns
GROUP BY service_type
ORDER BY count DESC;

-- 상태별 캠페인 개수 확인
SELECT 
  status,
  COUNT(*) as count
FROM campaigns
GROUP BY status
ORDER BY count DESC;