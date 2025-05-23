-- user-slot-number-schema.sql
-- slots 테이블에 매트별 슬롯 번호 추가
-- 각 매트(mat_id)마다 독립적인 번호 체계 구현

-- 1. user_slot_number 컬럼 추가
ALTER TABLE public.slots 
ADD COLUMN IF NOT EXISTS user_slot_number INTEGER;

-- 2. 매트별로 유니크한 슬롯 번호를 위한 복합 유니크 제약조건
ALTER TABLE public.slots 
DROP CONSTRAINT IF EXISTS unique_mat_slot_number;

ALTER TABLE public.slots 
ADD CONSTRAINT unique_mat_slot_number UNIQUE (mat_id, user_slot_number);

-- 3. 매트별 슬롯 번호 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_user_slot_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- 해당 매트의 마지막 번호 + 1 계산
    SELECT COALESCE(MAX(user_slot_number), 0) + 1
    INTO next_number
    FROM slots
    WHERE mat_id = NEW.mat_id;
    
    -- user_slot_number 설정
    NEW.user_slot_number := next_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 삭제 (이미 존재할 경우)
DROP TRIGGER IF EXISTS set_user_slot_number ON slots;

-- 5. 트리거 생성
CREATE TRIGGER set_user_slot_number
BEFORE INSERT ON slots
FOR EACH ROW
WHEN (NEW.user_slot_number IS NULL)
EXECUTE FUNCTION generate_user_slot_number();

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_slots_mat_slot_number 
ON public.slots(mat_id, user_slot_number);

-- 추가 인덱스: 사용자가 자신의 슬롯을 조회할 때 사용
CREATE INDEX IF NOT EXISTS idx_slots_user_mat_slot 
ON public.slots(user_id, mat_id, user_slot_number);

-- 7. 기존 데이터 마이그레이션
-- 각 매트별로 created_at 순서대로 번호 할당
WITH numbered_slots AS (
    SELECT 
        id,
        mat_id,
        ROW_NUMBER() OVER (PARTITION BY mat_id ORDER BY created_at) as new_number
    FROM slots
    WHERE user_slot_number IS NULL
)
UPDATE slots s
SET user_slot_number = ns.new_number
FROM numbered_slots ns
WHERE s.id = ns.id;

-- 8. NOT NULL 제약조건 추가 (마이그레이션 후)
ALTER TABLE public.slots 
ALTER COLUMN user_slot_number SET NOT NULL;

-- 9. 코멘트 추가
COMMENT ON COLUMN public.slots.user_slot_number IS '매트별 슬롯 순번 (각 매트마다 1부터 시작)';

-- 10. 확인 쿼리
-- 각 매트별 슬롯 번호 확인
SELECT 
    mat_id,
    user_id,
    COUNT(*) as total_slots,
    MIN(user_slot_number) as min_number,
    MAX(user_slot_number) as max_number
FROM slots
GROUP BY mat_id, user_id
ORDER BY total_slots DESC
LIMIT 20;