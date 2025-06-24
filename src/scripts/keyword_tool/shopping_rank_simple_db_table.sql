-- Supabase 간소화 스키마
-- 대시보드에서 시간별/일별 순위 변화를 보여주기 위한 최소한의 테이블

-- 기존 테이블 삭제 (초기화)
DROP TABLE IF EXISTS shopping_rankings_hourly CASCADE;
DROP TABLE IF EXISTS shopping_rankings_daily CASCADE;
DROP TABLE IF EXISTS shopping_rankings_current CASCADE;
DROP VIEW IF EXISTS shopping_top_products_weekly_trend CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_shopping_rankings CASCADE;
DROP FUNCTION IF EXISTS create_daily_shopping_snapshot CASCADE;

-- 1. 시간별 순위 스냅샷 (당일 24시간 데이터)
CREATE TABLE IF NOT EXISTS shopping_rankings_hourly (
    keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    hour TIMESTAMP WITH TIME ZONE NOT NULL,
    rank INTEGER NOT NULL,
    title TEXT NOT NULL,
    lprice INTEGER NOT NULL,
    image TEXT,
    mall_name VARCHAR(255),
    brand VARCHAR(255),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    link TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (keyword_id, product_id, hour)
);

-- 2. 일별 순위 스냅샷 (최근 30일 데이터)
CREATE TABLE IF NOT EXISTS shopping_rankings_daily (
    keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    rank INTEGER NOT NULL,
    title TEXT NOT NULL,
    lprice INTEGER NOT NULL,
    image TEXT,
    mall_name VARCHAR(255),
    brand VARCHAR(255),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    link TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (keyword_id, product_id, date)
);

-- 3. 현재 순위 (실시간 표시용)
CREATE TABLE IF NOT EXISTS shopping_rankings_current (
    keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    rank INTEGER NOT NULL,
    prev_rank INTEGER, -- 이전 순위 (순위 변동 표시용)
    title TEXT NOT NULL,
    lprice INTEGER NOT NULL,
    image TEXT,
    mall_name VARCHAR(255),
    brand VARCHAR(255),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    link TEXT,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (keyword_id, product_id)
);

-- 인덱스 생성
CREATE INDEX idx_shopping_rankings_hourly_keyword_hour ON shopping_rankings_hourly(keyword_id, hour DESC);
CREATE INDEX idx_shopping_rankings_daily_keyword_date ON shopping_rankings_daily(keyword_id, date DESC);
CREATE INDEX idx_shopping_rankings_current_keyword_rank ON shopping_rankings_current(keyword_id, rank);

-- 오래된 데이터 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_shopping_rankings()
RETURNS void AS $$
BEGIN
    -- 24시간 이상 된 시간별 데이터 삭제
    DELETE FROM shopping_rankings_hourly 
    WHERE hour < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    -- 30일 이상 된 일별 데이터 삭제
    DELETE FROM shopping_rankings_daily 
    WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 일별 스냅샷 생성 함수 (매일 자정 실행)
CREATE OR REPLACE FUNCTION create_daily_shopping_snapshot()
RETURNS void AS $$
BEGIN
    -- 어제 날짜의 마지막 데이터를 일별 테이블에 저장
    INSERT INTO shopping_rankings_daily (keyword_id, product_id, date, rank, title, lprice, 
                               image, mall_name, brand, category1, category2, link)
    SELECT DISTINCT ON (keyword_id, product_id)
        keyword_id,
        product_id,
        (CURRENT_DATE - INTERVAL '1 day')::date as date,
        rank,
        title,
        lprice,
        image,
        mall_name,
        brand,
        category1,
        category2,
        link
    FROM shopping_rankings_current
    WHERE collected_at::date = CURRENT_DATE - INTERVAL '1 day'
    ORDER BY keyword_id, product_id, collected_at DESC
    ON CONFLICT (keyword_id, product_id, date) 
    DO UPDATE SET
        rank = EXCLUDED.rank,
        title = EXCLUDED.title,
        lprice = EXCLUDED.lprice,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 뷰: 상위 10개 제품의 주간 트렌드
CREATE OR REPLACE VIEW shopping_top_products_weekly_trend AS
SELECT 
    r.keyword_id,
    r.product_id,
    r.title,
    r.brand,
    r.current_rank,
    d1.rank as day_1_ago,
    d2.rank as day_2_ago,
    d3.rank as day_3_ago,
    d4.rank as day_4_ago,
    d5.rank as day_5_ago,
    d6.rank as day_6_ago,
    d7.rank as day_7_ago
FROM (
    SELECT DISTINCT ON (keyword_id, product_id)
        keyword_id, product_id, rank as current_rank, title, brand
    FROM shopping_rankings_current
    WHERE rank <= 10
    ORDER BY keyword_id, product_id, rank
) r
LEFT JOIN shopping_rankings_daily d1 ON r.keyword_id = d1.keyword_id 
    AND r.product_id = d1.product_id AND d1.date = CURRENT_DATE - 1
LEFT JOIN shopping_rankings_daily d2 ON r.keyword_id = d2.keyword_id 
    AND r.product_id = d2.product_id AND d2.date = CURRENT_DATE - 2
LEFT JOIN shopping_rankings_daily d3 ON r.keyword_id = d3.keyword_id 
    AND r.product_id = d3.product_id AND d3.date = CURRENT_DATE - 3
LEFT JOIN shopping_rankings_daily d4 ON r.keyword_id = d4.keyword_id 
    AND r.product_id = d4.product_id AND d4.date = CURRENT_DATE - 4
LEFT JOIN shopping_rankings_daily d5 ON r.keyword_id = d5.keyword_id 
    AND r.product_id = d5.product_id AND d5.date = CURRENT_DATE - 5
LEFT JOIN shopping_rankings_daily d6 ON r.keyword_id = d6.keyword_id 
    AND r.product_id = d6.product_id AND d6.date = CURRENT_DATE - 6
LEFT JOIN shopping_rankings_daily d7 ON r.keyword_id = d7.keyword_id 
    AND r.product_id = d7.product_id AND d7.date = CURRENT_DATE - 7;