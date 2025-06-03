-- 검색 제한 시스템을 위한 Supabase 스키마

-- 1. 검색 타입 ENUM 생성
CREATE TYPE search_type AS ENUM ('shop', 'place');

-- 2. 검색 로그 테이블
CREATE TABLE search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_type search_type NOT NULL,
    search_query TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 검색 로그 인덱스
CREATE INDEX idx_search_logs_user_date ON search_logs(user_id, searched_at);
CREATE INDEX idx_search_logs_type ON search_logs(search_type);

-- 3. 일일 검색 횟수 집계 테이블
CREATE TABLE daily_search_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_type search_type NOT NULL,
    search_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, search_type, search_date)
);

-- 일일 검색 횟수 인덱스
CREATE INDEX idx_daily_search_counts_user_date ON daily_search_counts(user_id, search_date);

-- 4. 회원 등급별 검색 제한 설정 테이블
CREATE TABLE search_limits_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_role TEXT NOT NULL,
    search_type search_type NOT NULL,
    daily_limit INTEGER NOT NULL DEFAULT 100,
    monthly_limit INTEGER DEFAULT NULL, -- NULL이면 무제한
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_role, search_type)
);

-- 5. 추가 검색 권한 구매 테이블
CREATE TABLE search_quota_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_type search_type NOT NULL,
    quota_amount INTEGER NOT NULL,
    price INTEGER NOT NULL,
    valid_until DATE NOT NULL,
    used_amount INTEGER DEFAULT 0,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 월간 검색 통계 테이블
CREATE TABLE monthly_search_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_type search_type NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_searches INTEGER DEFAULT 0,
    unique_queries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, search_type, year, month)
);

-- 7. 기본 검색 제한 설정 데이터 삽입
INSERT INTO search_limits_config (user_role, search_type, daily_limit, monthly_limit) VALUES
    ('beginner', 'shop', 100, 3000),
    ('beginner', 'place', 100, 3000),
    ('advertiser', 'shop', 100, 3000),
    ('advertiser', 'place', 100, 3000),
    ('agency', 'shop', 100, 3000),
    ('agency', 'place', 100, 3000),
    ('distributor', 'shop', 100, 3000),
    ('distributor', 'place', 100, 3000),
    ('operator', 'shop', -1, NULL), -- -1은 무제한
    ('operator', 'place', -1, NULL),
    ('developer', 'shop', -1, NULL),
    ('developer', 'place', -1, NULL);

-- 8. 함수: 사용자의 일일 검색 횟수 조회
CREATE OR REPLACE FUNCTION get_daily_search_count(
    p_user_id UUID,
    p_search_type search_type,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COALESCE(count, 0)
    INTO v_count
    FROM daily_search_counts
    WHERE user_id = p_user_id
        AND search_type = p_search_type
        AND search_date = p_date;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- 9. 함수: 사용자의 검색 가능 여부 확인
CREATE OR REPLACE FUNCTION can_user_search(
    p_user_id UUID,
    p_search_type search_type,
    p_user_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily_limit INTEGER;
    v_monthly_limit INTEGER;
    v_daily_count INTEGER;
    v_monthly_count INTEGER;
    v_purchased_quota INTEGER;
    v_can_search BOOLEAN;
    v_remaining_daily INTEGER;
    v_remaining_monthly INTEGER;
BEGIN
    -- 회원 등급별 제한 조회
    SELECT daily_limit, monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM search_limits_config
    WHERE user_role = p_user_role AND search_type = p_search_type;
    
    -- 무제한인 경우
    IF v_daily_limit = -1 THEN
        RETURN jsonb_build_object(
            'can_search', true,
            'daily_limit', -1,
            'daily_used', 0,
            'monthly_limit', -1,
            'monthly_used', 0,
            'message', '무제한 검색 가능'
        );
    END IF;
    
    -- 오늘 검색 횟수 조회
    v_daily_count := get_daily_search_count(p_user_id, p_search_type);
    
    -- 이번 달 검색 횟수 조회
    SELECT COALESCE(SUM(count), 0)
    INTO v_monthly_count
    FROM daily_search_counts
    WHERE user_id = p_user_id
        AND search_type = p_search_type
        AND EXTRACT(YEAR FROM search_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM search_date) = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- 추가 구매 권한 확인
    SELECT COALESCE(SUM(quota_amount - used_amount), 0)
    INTO v_purchased_quota
    FROM search_quota_purchases
    WHERE user_id = p_user_id
        AND search_type = p_search_type
        AND valid_until >= CURRENT_DATE;
    
    -- 검색 가능 여부 판단
    v_can_search := v_daily_count < v_daily_limit;
    IF v_monthly_limit IS NOT NULL THEN
        v_can_search := v_can_search AND (v_monthly_count < v_monthly_limit + v_purchased_quota);
    END IF;
    
    v_remaining_daily := GREATEST(0, v_daily_limit - v_daily_count);
    v_remaining_monthly := CASE 
        WHEN v_monthly_limit IS NULL THEN -1
        ELSE GREATEST(0, v_monthly_limit + v_purchased_quota - v_monthly_count)
    END;
    
    RETURN jsonb_build_object(
        'can_search', v_can_search,
        'daily_limit', v_daily_limit,
        'daily_used', v_daily_count,
        'daily_remaining', v_remaining_daily,
        'monthly_limit', v_monthly_limit,
        'monthly_used', v_monthly_count,
        'monthly_remaining', v_remaining_monthly,
        'purchased_quota', v_purchased_quota,
        'message', CASE 
            WHEN NOT v_can_search AND v_daily_count >= v_daily_limit THEN '일일 검색 한도를 초과했습니다.'
            WHEN NOT v_can_search THEN '월간 검색 한도를 초과했습니다.'
            ELSE '검색 가능합니다.'
        END
    );
END;
$$;

-- 10. 함수: 검색 로그 추가
CREATE OR REPLACE FUNCTION add_search_log(
    p_user_id UUID,
    p_search_type search_type,
    p_search_query TEXT,
    p_result_count INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 검색 로그 추가
    INSERT INTO search_logs (user_id, search_type, search_query, result_count)
    VALUES (p_user_id, p_search_type, p_search_query, p_result_count);
    
    -- 일일 검색 횟수 업데이트
    INSERT INTO daily_search_counts (user_id, search_type, search_date, count)
    VALUES (p_user_id, p_search_type, v_today, 1)
    ON CONFLICT (user_id, search_type, search_date)
    DO UPDATE SET 
        count = daily_search_counts.count + 1,
        updated_at = NOW();
    
    -- 월간 통계 업데이트
    INSERT INTO monthly_search_stats (user_id, search_type, year, month, total_searches, unique_queries)
    VALUES (
        p_user_id, 
        p_search_type, 
        EXTRACT(YEAR FROM v_today)::INTEGER, 
        EXTRACT(MONTH FROM v_today)::INTEGER, 
        1,
        1
    )
    ON CONFLICT (user_id, search_type, year, month)
    DO UPDATE SET 
        total_searches = monthly_search_stats.total_searches + 1,
        unique_queries = (
            SELECT COUNT(DISTINCT search_query)
            FROM search_logs
            WHERE user_id = p_user_id
                AND search_type = p_search_type
                AND EXTRACT(YEAR FROM searched_at) = EXTRACT(YEAR FROM v_today)
                AND EXTRACT(MONTH FROM searched_at) = EXTRACT(MONTH FROM v_today)
        ),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 11. 함수: 사용자의 검색 통계 조회
CREATE OR REPLACE FUNCTION get_user_search_stats(
    p_user_id UUID,
    p_period TEXT DEFAULT 'month' -- 'day', 'week', 'month', 'year'
)
RETURNS TABLE (
    search_type search_type,
    total_searches BIGINT,
    unique_queries BIGINT,
    avg_daily_searches NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
BEGIN
    -- 기간 설정
    v_start_date := CASE p_period
        WHEN 'day' THEN CURRENT_DATE
        WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
        ELSE CURRENT_DATE - INTERVAL '30 days'
    END;
    
    RETURN QUERY
    SELECT 
        sl.search_type,
        COUNT(*)::BIGINT as total_searches,
        COUNT(DISTINCT sl.search_query)::BIGINT as unique_queries,
        ROUND(COUNT(*)::NUMERIC / GREATEST(1, CURRENT_DATE - v_start_date + 1), 2) as avg_daily_searches
    FROM search_logs sl
    WHERE sl.user_id = p_user_id
        AND sl.searched_at >= v_start_date
    GROUP BY sl.search_type;
END;
$$;

-- 12. RLS 정책 설정
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_search_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_search_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_quota_purchases ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 검색 로그만 조회 가능
CREATE POLICY "Users can view own search logs" ON search_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search logs" ON search_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 검색 횟수만 조회 가능
CREATE POLICY "Users can view own daily counts" ON daily_search_counts
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 월간 통계만 조회 가능
CREATE POLICY "Users can view own monthly stats" ON monthly_search_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 구매 내역만 조회 가능
CREATE POLICY "Users can view own purchases" ON search_quota_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- 관리자는 모든 데이터 조회 가능
CREATE POLICY "Admins can view all search logs" ON search_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );

-- 13. 자동 정리 함수 (30일 이상 된 로그 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_search_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM search_logs 
    WHERE searched_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- 14. 월간 통계 집계를 위한 크론 함수 (옵션)
CREATE OR REPLACE FUNCTION aggregate_monthly_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 이전 달의 통계를 집계
    INSERT INTO monthly_search_stats (user_id, search_type, year, month, total_searches, unique_queries)
    SELECT 
        user_id,
        search_type,
        EXTRACT(YEAR FROM search_date)::INTEGER,
        EXTRACT(MONTH FROM search_date)::INTEGER,
        SUM(count),
        COUNT(DISTINCT search_date)
    FROM daily_search_counts
    WHERE search_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND search_date < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY user_id, search_type, EXTRACT(YEAR FROM search_date), EXTRACT(MONTH FROM search_date)
    ON CONFLICT (user_id, search_type, year, month)
    DO UPDATE SET 
        total_searches = EXCLUDED.total_searches,
        updated_at = NOW();
END;
$$;