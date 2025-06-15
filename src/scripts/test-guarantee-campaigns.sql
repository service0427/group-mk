-- =============================================================================
-- 테스트용 보장형 캠페인 데이터 삽입
-- 작성일: 2025-01-15
-- 설명: 보장형 캠페인 기능 테스트를 위한 샘플 데이터
-- =============================================================================

-- 1. 네이버 쇼핑 트래픽 보장형 캠페인
UPDATE campaigns 
SET 
    slot_type = 'guarantee',
    guarantee_count = 10,
    guarantee_unit = '일',
    target_rank = 3,
    is_guarantee = TRUE,
    is_negotiable = TRUE,
    min_guarantee_price = 80000,
    max_guarantee_price = 150000
WHERE campaign_name = 'NS 트래픽 곰' 
AND service_type = 'NaverShoppingTraffic';

-- 2. 네이버 플레이스 저장 보장형 캠페인
UPDATE campaigns 
SET 
    slot_type = 'guarantee',
    guarantee_count = 20,
    guarantee_unit = '회',
    target_rank = 5,
    is_guarantee = TRUE,
    is_negotiable = TRUE,
    min_guarantee_price = 50000,
    max_guarantee_price = 100000
WHERE campaign_name = 'NP 저장 고양이'
AND service_type = 'NaverPlaceSave';

-- 3. 쿠팡 트래픽 보장형 캠페인
UPDATE campaigns 
SET 
    slot_type = 'guarantee',
    guarantee_count = 5,
    guarantee_unit = '일',
    target_rank = 1,
    is_guarantee = TRUE,
    is_negotiable = TRUE,
    min_guarantee_price = 200000,
    max_guarantee_price = 500000
WHERE campaign_name = 'CP 트래픽 사자'
AND service_type = 'CoupangTraffic';

-- 확인 쿼리
SELECT 
    id,
    campaign_name,
    service_type,
    slot_type,
    guarantee_count,
    guarantee_unit,
    target_rank,
    is_guarantee,
    is_negotiable,
    min_guarantee_price,
    max_guarantee_price
FROM campaigns
WHERE slot_type = 'guarantee';