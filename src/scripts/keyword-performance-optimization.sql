-- 키워드 테이블 성능 최적화를 위한 추가 인덱스

-- 1. 복합 인덱스: group_id + created_at (정렬 성능 개선)
CREATE INDEX idx_keywords_group_created ON keywords(group_id, created_at DESC);

-- 2. 복합 인덱스: group_id + is_active (활성 상태 필터링 성능 개선)
CREATE INDEX idx_keywords_group_active ON keywords(group_id, is_active);

-- 3. 텍스트 검색을 위한 GIN 인덱스 (PostgreSQL의 경우)
-- 키워드 검색 성능 대폭 개선
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- trigram 확장 활성화

-- 각 키워드 필드에 대한 GIN 인덱스
CREATE INDEX idx_keywords_main_keyword_gin ON keywords USING gin (main_keyword gin_trgm_ops);
CREATE INDEX idx_keywords_keyword1_gin ON keywords USING gin (keyword1 gin_trgm_ops);
CREATE INDEX idx_keywords_keyword2_gin ON keywords USING gin (keyword2 gin_trgm_ops);
CREATE INDEX idx_keywords_keyword3_gin ON keywords USING gin (keyword3 gin_trgm_ops);

-- 4. 캠페인 관련 필드 인덱스 (keyword_groups 테이블)
CREATE INDEX idx_keyword_groups_campaign ON keyword_groups(campaign_type);
CREATE INDEX idx_keyword_groups_user_campaign ON keyword_groups(user_id, campaign_type);

-- 5. 정렬을 위한 추가 인덱스
CREATE INDEX idx_keywords_group_main_keyword ON keywords(group_id, main_keyword);
CREATE INDEX idx_keywords_group_mid ON keywords(group_id, mid);

-- 6. 통계 정보 업데이트 (성능 최적화)
ANALYZE keywords;
ANALYZE keyword_groups;

-- 참고: 인덱스 생성 후 확인
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'keywords';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'keyword_groups';

-- 쿼리 실행 계획 확인 예시
-- EXPLAIN ANALYZE 
-- SELECT * FROM keywords 
-- WHERE group_id = 1 
-- AND (main_keyword ILIKE '%test%' OR keyword1 ILIKE '%test%' OR keyword2 ILIKE '%test%' OR keyword3 ILIKE '%test%')
-- ORDER BY created_at DESC 
-- LIMIT 10;