-- =============================================================================
-- campaigns 테이블 수정 - 보장성 슬롯 지원
-- 작성일: 2025-01-13
-- 설명: 기존 campaigns 테이블에 보장성 슬롯 관련 필드 추가
-- =============================================================================

-- 1. campaigns 테이블에 보장성 슬롯 관련 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS guarantee_count INTEGER,  -- 보장 횟수 (예: 10회)
ADD COLUMN IF NOT EXISTS target_rank INTEGER,      -- 목표 순위 (예: 3위)
ADD COLUMN IF NOT EXISTS is_guarantee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT FALSE,  -- 가격 협상 가능 여부
ADD COLUMN IF NOT EXISTS min_guarantee_price NUMERIC(10,2),  -- 최소 보장 가격 (회당)
ADD COLUMN IF NOT EXISTS max_guarantee_price NUMERIC(10,2);  -- 최대 보장 가격 (회당)

-- 2. 제약 조건 추가
ALTER TABLE public.campaigns
ADD CONSTRAINT slot_type_check CHECK (slot_type IN ('standard', 'guarantee')),
ADD CONSTRAINT guarantee_count_check CHECK (
    (slot_type = 'guarantee' AND guarantee_count IS NOT NULL AND guarantee_count > 0) OR
    (slot_type = 'standard' AND guarantee_count IS NULL)
),
ADD CONSTRAINT target_rank_check CHECK (
    (slot_type = 'guarantee' AND target_rank IS NOT NULL AND target_rank > 0) OR
    (slot_type = 'standard' AND target_rank IS NULL)
),
ADD CONSTRAINT guarantee_price_check CHECK (
    (is_negotiable = TRUE AND min_guarantee_price IS NOT NULL AND max_guarantee_price IS NOT NULL AND min_guarantee_price <= max_guarantee_price) OR
    (is_negotiable = FALSE)
);

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_slot_type ON campaigns(slot_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_guarantee ON campaigns(is_guarantee);

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN campaigns.slot_type IS '슬롯 유형 (standard: 일반, guarantee: 보장성)';
COMMENT ON COLUMN campaigns.guarantee_count IS '보장 횟수 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.target_rank IS '목표 순위 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.is_guarantee IS '보장성 슬롯 여부';
COMMENT ON COLUMN campaigns.is_negotiable IS '가격 협상 가능 여부 (보장성 슬롯)';
COMMENT ON COLUMN campaigns.min_guarantee_price IS '최소 보장 가격 (회당)';
COMMENT ON COLUMN campaigns.max_guarantee_price IS '최대 보장 가격 (회당)';

-- 5. 보장성 캠페인 뷰 생성
CREATE OR REPLACE VIEW guarantee_campaigns_view AS
SELECT 
    c.id,
    c.campaign_name,
    c.service_type,
    c.slot_type,
    c.guarantee_count,
    c.target_rank,
    c.is_negotiable,
    c.min_guarantee_price,
    c.max_guarantee_price,
    c.status,
    c.created_at,
    COUNT(DISTINCT gs.id) as active_guarantee_slots,
    COUNT(DISTINCT gsr.id) as pending_requests
FROM campaigns c
LEFT JOIN guarantee_slots gs ON c.id = gs.product_id AND gs.status = 'active'
LEFT JOIN guarantee_slot_requests gsr ON c.id = gsr.campaign_id AND gsr.status IN ('requested', 'negotiating')
WHERE c.slot_type = 'guarantee'
AND c.is_guarantee = TRUE
GROUP BY c.id;

-- 6. 트리거: is_guarantee 필드 자동 설정
CREATE OR REPLACE FUNCTION update_is_guarantee_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slot_type = 'guarantee' THEN
        NEW.is_guarantee = TRUE;
    ELSE
        NEW.is_guarantee = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_is_guarantee
    BEFORE INSERT OR UPDATE OF slot_type ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_is_guarantee_flag();

-- 7. 샘플 보장성 캠페인 데이터 (선택사항)
-- 실제 운영 시에는 이 부분을 제거하거나 별도 파일로 관리
/*
INSERT INTO campaigns (
    campaign_name,
    service_type,
    slot_type,
    guarantee_count,
    target_rank,
    is_negotiable,
    min_guarantee_price,
    max_guarantee_price,
    status
) VALUES 
    ('네이버 쇼핑 3위 10회 보장', 'naver_shopping', 'guarantee', 10, 3, TRUE, 80000, 150000, 'active'),
    ('네이버 플레이스 5위 20회 보장', 'naver_place', 'guarantee', 20, 5, TRUE, 50000, 100000, 'active'),
    ('쿠팡 1위 5회 보장', 'coupang', 'guarantee', 5, 1, TRUE, 200000, 500000, 'active');
*/

-- 8. 기존 캠페인 데이터 마이그레이션
-- 모든 기존 캠페인을 'standard' 타입으로 설정 (이미 DEFAULT로 설정되어 있음)
UPDATE campaigns 
SET slot_type = 'standard', is_guarantee = FALSE 
WHERE slot_type IS NULL;

-- 9. 통계 함수: 보장성 슬롯 캠페인 통계
CREATE OR REPLACE FUNCTION get_guarantee_campaign_stats(p_campaign_id INTEGER)
RETURNS TABLE (
    total_requests BIGINT,
    active_slots BIGINT,
    completed_slots BIGINT,
    total_revenue NUMERIC,
    avg_negotiated_price NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT gsr.id) as total_requests,
        COUNT(DISTINCT CASE WHEN gs.status = 'active' THEN gs.id END) as active_slots,
        COUNT(DISTINCT CASE WHEN gs.status = 'completed' THEN gs.id END) as completed_slots,
        COALESCE(SUM(CASE WHEN gs.status IN ('active', 'completed') THEN gs.total_amount END), 0) as total_revenue,
        AVG(gs.daily_guarantee_amount) as avg_negotiated_price,
        CASE 
            WHEN COUNT(DISTINCT gs.id) > 0 THEN 
                COUNT(DISTINCT CASE WHEN gs.status = 'completed' THEN gs.id END)::NUMERIC / COUNT(DISTINCT gs.id) * 100
            ELSE 0 
        END as success_rate
    FROM campaigns c
    LEFT JOIN guarantee_slot_requests gsr ON c.id = gsr.campaign_id
    LEFT JOIN guarantee_slots gs ON c.id = gs.product_id
    WHERE c.id = p_campaign_id
    AND c.slot_type = 'guarantee';
END;
$$ LANGUAGE plpgsql;

-- 10. 권한 설정 (필요한 경우)
-- GRANT SELECT ON guarantee_campaigns_view TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_guarantee_campaign_stats TO authenticated;