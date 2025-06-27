-- =============================================================================
-- User Cash History View with Slots, Guarantee Slots and Keywords
-- =============================================================================
-- Description: 
--   이 뷰는 user_cash_history 테이블을 slots, guarantee_slots와 keywords 테이블과 조인하여
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
    
    -- slots 테이블에서 가져올 정보 (일반 슬롯)
    s.product_id,
    s.keyword_id,
    s.user_slot_number,
    s.status AS slot_status,
    s.start_date AS slot_start_date,
    s.end_date AS slot_end_date,
    s.quantity,
    s.input_data AS slot_input_data,
    
    -- guarantee_slots 테이블에서 가져올 정보 (보장형 슬롯)
    COALESCE(s.product_id, gs.product_id) AS final_product_id,
    COALESCE(s.keyword_id, gs.keyword_id) AS final_keyword_id,
    gs.target_rank AS guarantee_target_rank,
    gs.guarantee_count,
    gs.guarantee_unit,
    gs.daily_guarantee_amount,
    
    -- keywords 테이블에서 가져올 정보 (일반 슬롯과 보장형 슬롯 모두 처리)
    k.main_keyword,
    k.keyword1,
    k.keyword2,
    k.keyword3,
    k.is_active AS keyword_is_active,
    k.description AS keyword_description,
    k.url AS keyword_url,
    
    -- campaigns 테이블에서 가져올 정보 (일반 슬롯과 보장형 슬롯 모두 처리)
    c.campaign_name,
    c.service_type,
    c.group_id AS campaign_group_id,
    c.unit_price,
    c.slot_type,
    c.add_info AS campaign_add_info,
    
    -- 추가 계산 필드
    CASE 
        WHEN s.id IS NOT NULL OR gs.id IS NOT NULL THEN true
        ELSE false
    END AS is_slot_transaction,
    
    -- 슬롯 타입 구분
    CASE 
        WHEN gs.id IS NOT NULL THEN 'guarantee'
        WHEN s.id IS NOT NULL THEN 'normal'
        ELSE NULL
    END AS transaction_slot_type,
    
    -- 키워드 조합 (PostgreSQL 문법)
    CASE 
        WHEN (s.id IS NOT NULL OR gs.id IS NOT NULL) AND k.id IS NOT NULL THEN 
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
    -- guarantee_slots 테이블과 LEFT JOIN (reference_id로 조인)
    LEFT JOIN public.guarantee_slots gs
        ON uch.reference_id = gs.id
    -- keywords 테이블과 LEFT JOIN (일반 슬롯과 보장형 슬롯 모두 처리)
    LEFT JOIN public.keywords k 
        ON COALESCE(s.keyword_id, gs.keyword_id) = k.id
    -- campaigns 테이블과 LEFT JOIN (일반 슬롯과 보장형 슬롯 모두 처리)
    LEFT JOIN public.campaigns c
        ON COALESCE(s.product_id, gs.product_id) = c.id;

-- 뷰에 대한 코멘트 추가
COMMENT ON VIEW public.user_cash_history_detailed IS 
'user_cash_history와 관련 테이블(slots, guarantee_slots, keywords, campaigns)을 조인한 상세 뷰';

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
    transaction_slot_type,
    transaction_at
FROM user_cash_history_detailed
WHERE user_id = 'user-uuid-here'
ORDER BY transaction_at DESC;

-- 2. 보장형 슬롯 관련 거래만 조회
SELECT 
    transaction_type,
    amount,
    main_keyword,
    campaign_name,
    guarantee_target_rank,
    guarantee_count,
    transaction_at
FROM user_cash_history_detailed
WHERE transaction_slot_type = 'guarantee'
    AND user_id = 'user-uuid-here'
ORDER BY transaction_at DESC;

-- 3. 일반 슬롯 관련 거래만 조회
SELECT 
    transaction_type,
    amount,
    main_keyword,
    campaign_name,
    slot_status,
    transaction_at
FROM user_cash_history_detailed
WHERE transaction_slot_type = 'normal'
    AND user_id = 'user-uuid-here'
ORDER BY transaction_at DESC;
*/