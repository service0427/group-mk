-- MID 컬럼을 BIGINT로 변경하는 마이그레이션
-- INTEGER 범위: -2,147,483,648 ~ 2,147,483,647
-- BIGINT 범위: -9,223,372,036,854,775,808 ~ 9,223,372,036,854,775,807

-- 1. keywords 테이블의 mid 컬럼 타입 변경
ALTER TABLE keywords 
ALTER COLUMN mid TYPE BIGINT USING mid::BIGINT;

-- 2. 인덱스가 있다면 재생성 (기존 인덱스는 자동으로 업데이트됨)
-- 인덱스 확인
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'keywords' AND indexdef LIKE '%mid%';

-- 3. 변경 확인
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'keywords' 
AND column_name = 'mid';

-- 참고: 이미 데이터가 있는 경우에도 안전하게 변환됩니다.
-- INTEGER에서 BIGINT로의 변환은 데이터 손실 없이 가능합니다.