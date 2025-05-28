-- Supabase SQL Editor에서 실행할 인덱스 생성 스크립트
-- 성능 개선을 위한 최소한의 필수 인덱스만 포함

-- 1. 복합 인덱스: group_id + created_at (정렬 성능 개선)
-- 가장 자주 사용되는 쿼리 패턴에 최적화
CREATE INDEX IF NOT EXISTS idx_keywords_group_created 
ON keywords(group_id, created_at DESC);

-- 2. 복합 인덱스: group_id + is_active (활성 상태 필터링 성능 개선)
CREATE INDEX IF NOT EXISTS idx_keywords_group_active 
ON keywords(group_id, is_active);

-- 3. 캠페인 타입 인덱스 (그룹 필터링 성능 개선)
CREATE INDEX IF NOT EXISTS idx_keyword_groups_campaign 
ON keyword_groups(campaign_type);

-- 4. 사용자별 캠페인 타입 조회 성능 개선
CREATE INDEX IF NOT EXISTS idx_keyword_groups_user_campaign 
ON keyword_groups(user_id, campaign_type);

-- 5. 검색 성능 개선을 위한 부분 인덱스 (NULL이 아닌 값만 인덱싱)
CREATE INDEX IF NOT EXISTS idx_keywords_keyword1_partial 
ON keywords(keyword1) 
WHERE keyword1 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_keywords_keyword2_partial 
ON keywords(keyword2) 
WHERE keyword2 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_keywords_keyword3_partial 
ON keywords(keyword3) 
WHERE keyword3 IS NOT NULL;

-- 6. 통계 정보 업데이트
ANALYZE keywords;
ANALYZE keyword_groups;

-- 인덱스 생성 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('keywords', 'keyword_groups')
ORDER BY tablename, indexname;