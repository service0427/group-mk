-- =============================================================================
-- campaigns 테이블에 보장 기간 컬럼 추가
-- 작성일: 2025-06-23
-- 설명: 보장형 슬롯에서 실제 보장 기간을 저장하기 위한 컬럼 추가
-- =============================================================================

-- 1. campaigns 테이블에 보장 기간 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS guarantee_period INTEGER;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN campaigns.guarantee_period IS '보장 기간 (일 단위, 보장성 슬롯인 경우)';

-- 3. 기존 보장형 캠페인의 guarantee_period 기본값 설정
-- 기존 보장형 캠페인에 대해 guarantee_count와 동일한 값으로 초기화
UPDATE public.campaigns
SET guarantee_period = CASE 
    WHEN guarantee_unit = '일' THEN guarantee_count
    ELSE 30 -- 회 단위인 경우 기본 30일로 설정
END
WHERE slot_type = 'guarantee' AND guarantee_period IS NULL;

-- 4. 제약 조건 추가
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS guarantee_period_check;

ALTER TABLE public.campaigns
ADD CONSTRAINT guarantee_period_check CHECK (
    (slot_type = 'guarantee' AND guarantee_period IS NOT NULL AND guarantee_period > 0) OR
    (slot_type = 'standard' AND guarantee_period IS NULL)
);

-- 5. 인덱스 추가 (보장형 캠페인의 보장 기간 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_campaigns_guarantee_period 
ON campaigns(guarantee_period) 
WHERE slot_type = 'guarantee';

-- 6. 기존 guarantee_count 및 guarantee_unit 컬럼 설명 업데이트
COMMENT ON COLUMN campaigns.guarantee_count IS '작업 횟수 또는 작업 일수 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.guarantee_unit IS '작업 단위 (일: 작업 일수, 회: 작업 횟수)';