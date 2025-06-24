-- guarantee_unit 제약조건 수정 (한글 값 허용)
-- 작성일: 2025-01-24

-- 먼저 campaigns 테이블에서 사용 중인 guarantee_unit 값 확인
-- SELECT DISTINCT guarantee_unit FROM campaigns WHERE guarantee_unit IS NOT NULL;

-- 기존 제약조건 제거
ALTER TABLE guarantee_slots 
DROP CONSTRAINT IF EXISTS guarantee_slots_guarantee_unit_check;

ALTER TABLE guarantee_slots 
DROP CONSTRAINT IF EXISTS guarantee_unit_check;

-- 새로운 제약조건 추가 (한글 및 영문 모두 허용)
ALTER TABLE guarantee_slots 
ADD CONSTRAINT guarantee_unit_check 
CHECK (guarantee_unit IN ('daily', 'count', '일', '회'));

-- 기본값도 한글로 변경 (campaigns와 일치)
ALTER TABLE guarantee_slots 
ALTER COLUMN guarantee_unit SET DEFAULT '일';

-- 확인 쿼리
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'guarantee_slots'::regclass 
-- AND conname LIKE '%guarantee_unit%';