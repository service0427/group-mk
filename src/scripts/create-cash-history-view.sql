-- =============================================================================
-- User Cash History View with Slots and Keywords
-- =============================================================================
-- Description: 
--   이 뷰는 user_cash_history 테이블을 slots와 keywords 테이블과 조인하여
--   캐시 이력에 대한 상세 정보를 제공합니다.
-- =============================================================================

-- 기존 뷰가 있으면 삭제
DROP VIEW IF EXISTS public.user_cash_history_detailed CASCADE;

-- user_cash_history_detailed 뷰 생성
CREATE VIEW public.user_cash_history_detailed AS
SELECT 
    -- user_cash_history의 모든 컬럼
    uch.id,
    uch.user_id,
    uch.transaction_type,
    uch.amount,
    uch.description,
    uch.transaction_at,
    uch.reference_id,
    uch.ip_address,
    uch.user_agent,
    uch.expired_dt,
    uch.mat_id,
    uch.balance_type,
    
    -- slots 테이블에서 가져올 정보
    s.product_id,
    s.keyword_id,
    s.user_slot_number,
    s.status AS slot_status,
    s.start_date AS slot_start_date,
    s.end_date AS slot_end_date,
    s.quantity,
    s.input_data AS slot_input_data,
    
    -- keywords 테이블에서 가져올 정보
    k.main_keyword,
    k.keyword1,
    k.keyword2,
    k.keyword3,
    k.is_active AS keyword_is_active,
    k.description AS keyword_description,
    k.url AS keyword_url,
    
    -- campaigns 테이블에서 가져올 정보
    c.campaign_name,
    c.service_type,
    c.group_id AS campaign_group_id,
    c.unit_price,
    c.slot_type,
    c.add_info AS campaign_add_info,
    
    -- 추가 계산 필드
    CASE 
        WHEN s.id IS NOT NULL THEN true
        ELSE false
    END AS is_slot_transaction,
    
    -- 키워드 조합 (PostgreSQL 문법)
    CASE 
        WHEN s.id IS NOT NULL AND k.id IS NOT NULL THEN 
            k.main_keyword || 
            COALESCE(', ' || k.keyword1, '') ||
            COALESCE(', ' || k.keyword2, '') ||
            COALESCE(', ' || k.keyword3, '')
        ELSE NULL
    END AS keywords_combined

FROM 
    public.user_cash_history uch
    -- slots 테이블과 LEFT JOIN (reference_id로 조인)
    LEFT JOIN public.slots s 
        ON uch.reference_id = s.id
    -- keywords 테이블과 LEFT JOIN (keyword_id로 조인)
    LEFT JOIN public.keywords k 
        ON s.keyword_id = k.id
    -- campaigns 테이블과 LEFT JOIN (product_id로 조인)
    LEFT JOIN public.campaigns c
        ON s.product_id = c.id;

-- 뷰에 대한 코멘트 추가
COMMENT ON VIEW public.user_cash_history_detailed IS 
'user_cash_history와 관련 테이블(slots, keywords, campaigns)을 조인한 상세 뷰';

-- 권한 설정
GRANT SELECT ON public.user_cash_history_detailed TO authenticated;
GRANT ALL ON public.user_cash_history_detailed TO service_role;

-- =============================================================================
-- 사용 예시
-- =============================================================================

/*
-- 1. 특정 사용자의 모든 캐시 이력 조회 (키워드 정보 포함)
SELECT 
    transaction_type,
    amount,
    description,
    main_keyword,
    keywords_combined,
    campaign_name,
    service_type,
    transaction_at
FROM user_cash_history_detailed
WHERE user_id = 'user-uuid-here'
ORDER BY transaction_at DESC;

-- 2. 슬롯 관련 거래만 조회
SELECT 
    transaction_type,
    amount,
    main_keyword,
    campaign_name,
    slot_status,
    transaction_at
FROM user_cash_history_detailed
WHERE is_slot_transaction = true
    AND user_id = 'user-uuid-here'
ORDER BY transaction_at DESC;

-- 3. 특정 키워드의 모든 거래 내역
SELECT 
    user_id,
    transaction_type,
    amount,
    user_slot_number,
    transaction_at
FROM user_cash_history_detailed
WHERE main_keyword = '특정키워드'
ORDER BY transaction_at DESC;

-- 4. 환불 거래와 관련 키워드 정보
SELECT 
    amount,
    main_keyword,
    campaign_name,
    service_type,
    description,
    transaction_at
FROM user_cash_history_detailed
WHERE transaction_type = 'refund'
    AND user_id = 'user-uuid-here'
ORDER BY transaction_at DESC;
*/