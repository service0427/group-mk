-- 네이버 검색광고 키워드 도구 DB 설계 (간소화 버전)

-- 1. API 키 관리 테이블 (평문 저장)
CREATE TABLE naver_searchad_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    secret_key VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 키워드 검색 결과 저장 테이블 (search_keywords로 명명)
CREATE TABLE search_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword VARCHAR(200) NOT NULL,
    pc_count INTEGER NOT NULL,
    mobile_count INTEGER NOT NULL,
    total_count INTEGER NOT NULL,
    pc_ratio DECIMAL(5,2) NOT NULL,
    mobile_ratio DECIMAL(5,2) NOT NULL,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 기존 keyword_groups 테이블과 연동을 위한 관계 테이블 (선택적)
-- keyword_groups 테이블이 이미 존재한다고 가정
CREATE TABLE search_keyword_group_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_keyword_id UUID REFERENCES search_keywords(id) ON DELETE CASCADE,
    keyword_group_id UUID REFERENCES keyword_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(search_keyword_id, keyword_group_id)
);

-- 4. API 사용 로그 테이블 (간소화)
CREATE TABLE searchad_api_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 1,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX idx_api_keys_user ON naver_searchad_api_keys(user_id);
CREATE INDEX idx_search_keywords_user ON search_keywords(user_id);
CREATE INDEX idx_search_keywords_date ON search_keywords(searched_at DESC);
CREATE INDEX idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX idx_api_logs_user_date ON searchad_api_logs(user_id, created_at DESC);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON naver_searchad_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰: 최근 인기 키워드
CREATE OR REPLACE VIEW popular_keywords AS
SELECT 
    keyword,
    COUNT(*) as search_count,
    AVG(total_count) as avg_total_count,
    AVG(pc_count) as avg_pc_count,
    AVG(mobile_count) as avg_mobile_count,
    MAX(searched_at) as last_searched_at
FROM search_keywords
WHERE searched_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY keyword
ORDER BY search_count DESC
LIMIT 100;

-- 뷰: 사용자별 검색 통계
CREATE OR REPLACE VIEW user_search_stats AS
SELECT 
    user_id,
    COUNT(*) as total_searches,
    COUNT(DISTINCT keyword) as unique_keywords,
    DATE(searched_at) as search_date
FROM search_keywords
WHERE searched_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY user_id, DATE(searched_at);

-- 샘플 데이터 조회 쿼리들

-- 1. 특정 사용자의 최근 검색 키워드
-- SELECT * FROM search_keywords 
-- WHERE user_id = ? 
-- ORDER BY searched_at DESC 
-- LIMIT 50;

-- 2. 특정 키워드의 검색 추이
-- SELECT 
--     DATE(searched_at) as date,
--     AVG(total_count) as avg_total,
--     AVG(pc_count) as avg_pc,
--     AVG(mobile_count) as avg_mobile
-- FROM search_keywords
-- WHERE keyword = ?
-- GROUP BY DATE(searched_at)
-- ORDER BY date DESC;

-- 3. 사용자의 API 키 조회
-- SELECT * FROM naver_searchad_api_keys
-- WHERE user_id = ? AND is_active = true;