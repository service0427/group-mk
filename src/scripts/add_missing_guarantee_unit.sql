-- guarantee_slots 테이블에 누락된 guarantee_unit 컬럼 추가
-- 작성일: 2025-01-24

-- guarantee_unit 컬럼이 없으면 추가
ALTER TABLE guarantee_slots 
ADD COLUMN IF NOT EXISTS guarantee_unit VARCHAR(10) DEFAULT 'daily';

-- 제약조건 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'guarantee_slots_guarantee_unit_check'
  ) THEN
    ALTER TABLE guarantee_slots 
    ADD CONSTRAINT guarantee_slots_guarantee_unit_check 
    CHECK (guarantee_unit IN ('daily', 'count'));
  END IF;
END $$;

-- 기존 데이터 업데이트 (캠페인 정보에서 가져오기)
UPDATE guarantee_slots gs
SET guarantee_unit = c.guarantee_unit
FROM campaigns c
WHERE gs.product_id = c.id
  AND gs.guarantee_unit IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN guarantee_slots.guarantee_unit IS '보장 단위 (daily: 일별, count: 횟수별)';