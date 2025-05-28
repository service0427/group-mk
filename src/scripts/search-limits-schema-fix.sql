-- can_user_search 함수의 반환값을 camelCase로 수정
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
            'canSearch', true,
            'dailyLimit', -1,
            'dailyUsed', 0,
            'dailyRemaining', -1,
            'monthlyLimit', -1,
            'monthlyUsed', 0,
            'monthlyRemaining', -1,
            'purchasedQuota', 0,
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
        'canSearch', v_can_search,
        'dailyLimit', v_daily_limit,
        'dailyUsed', v_daily_count,
        'dailyRemaining', v_remaining_daily,
        'monthlyLimit', v_monthly_limit,
        'monthlyUsed', v_monthly_count,
        'monthlyRemaining', v_remaining_monthly,
        'purchasedQuota', v_purchased_quota,
        'message', CASE 
            WHEN NOT v_can_search AND v_daily_count >= v_daily_limit THEN '일일 검색 한도를 초과했습니다.'
            WHEN NOT v_can_search THEN '월간 검색 한도를 초과했습니다.'
            ELSE '검색 가능합니다.'
        END
    );
END;
$$;