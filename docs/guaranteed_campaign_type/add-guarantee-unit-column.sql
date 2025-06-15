-- =============================================================================
-- campaigns 테이블에 guarantee_unit 컬럼 추가
-- 작성일: 2025-01-15
-- 설명: 보장형 캠페인의 단위(일/회) 정보를 저장하는 컬럼 추가
-- =============================================================================

-- 1. campaigns 테이블에 guarantee_unit 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS guarantee_unit VARCHAR(10) DEFAULT '일';

-- 2. 제약 조건 추가 - 허용된 값만 입력 가능하도록
ALTER TABLE public.campaigns
ADD CONSTRAINT guarantee_unit_check CHECK (
    guarantee_unit IN ('일', '회') OR guarantee_unit IS NULL
);

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN campaigns.guarantee_unit IS '보장 단위 (일: 기간 기준, 회: 횟수 기준)';

-- 4. 기존 보장형 캠페인 데이터 업데이트 (있는 경우)
-- 기본값을 '일'로 설정
UPDATE campaigns 
SET guarantee_unit = '일' 
WHERE slot_type = 'guarantee' AND guarantee_unit IS NULL;

-- 5. 인덱스 추가 (필요한 경우)
CREATE INDEX IF NOT EXISTS idx_campaigns_guarantee_unit ON campaigns(guarantee_unit) 
WHERE slot_type = 'guarantee';

-- 6. 보장성 캠페인 뷰 업데이트
DROP VIEW IF EXISTS guarantee_campaigns_view;
CREATE OR REPLACE VIEW guarantee_campaigns_view AS
SELECT 
    c.id,
    c.campaign_name,
    c.service_type,
    c.slot_type,
    c.guarantee_count,
    c.guarantee_unit,  -- 추가된 컬럼
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

-- 7. 권한 설정 (필요한 경우)
-- GRANT SELECT ON guarantee_campaigns_view TO authenticated;