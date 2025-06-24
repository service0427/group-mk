-- guarantee_unit 제약조건 수정
-- 한글 값도 허용하도록 변경

-- 기존 제약조건 제거
ALTER TABLE guarantee_slots 
DROP CONSTRAINT IF EXISTS guarantee_slots_guarantee_unit_check;

ALTER TABLE guarantee_slots 
DROP CONSTRAINT IF EXISTS guarantee_unit_check;

-- 새로운 제약조건 추가 (한글 포함)
ALTER TABLE guarantee_slots 
ADD CONSTRAINT guarantee_unit_check 
CHECK (guarantee_unit IN ('daily', 'count', '일', '회'));