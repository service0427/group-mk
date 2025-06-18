-- =============================================================================
-- campaigns 테이블에 보장성 슬롯 관련 컬럼 추가
-- 작성일: 2025-06-15
-- 설명: 보장성 슬롯 시스템을 위한 campaigns 테이블 확장
-- =============================================================================

-- 1. campaigns 테이블에 보장성 슬롯 관련 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_guarantee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guarantee_count INTEGER,
ADD COLUMN IF NOT EXISTS target_rank INTEGER,
ADD COLUMN IF NOT EXISTS min_guarantee_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS max_guarantee_price NUMERIC(10,2);

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
COMMENT ON COLUMN campaigns.is_guarantee IS '보장성 슬롯 여부';
COMMENT ON COLUMN campaigns.is_negotiable IS '가격 협상 가능 여부 (보장성 슬롯)';
COMMENT ON COLUMN campaigns.guarantee_count IS '보장 횟수 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.target_rank IS '목표 순위 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.min_guarantee_price IS '최소 보장 가격 (회당)';
COMMENT ON COLUMN campaigns.max_guarantee_price IS '최대 보장 가격 (회당)';

-- 5. 기존 데이터 마이그레이션 (모든 기존 캠페인을 standard 타입으로 설정)
UPDATE campaigns 
SET slot_type = 'standard', is_guarantee = FALSE 
WHERE slot_type IS NULL;