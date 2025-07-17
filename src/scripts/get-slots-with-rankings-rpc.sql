-- 슬롯과 순위 정보를 JOIN해서 가져오는 RPC 함수
-- JSONB 필드를 서버에서 처리하여 성능 향상

-- 함수 삭제 (이미 존재하는 경우)
DROP FUNCTION IF EXISTS get_slots_with_rankings(text, uuid, text, text, text, text, text, int, boolean);

-- 새 함수 생성
CREATE OR REPLACE FUNCTION get_slots_with_rankings(
  p_service_type text,
  p_user_id uuid DEFAULT NULL,
  p_user_role text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL,
  p_search_term text DEFAULT NULL,
  p_campaign_id int DEFAULT NULL,
  p_is_operator boolean DEFAULT false
)
RETURNS TABLE (
  -- 슬롯 정보
  slot_id uuid,
  mat_id text,
  product_id bigint,
  user_id uuid,
  status text,
  submitted_at timestamptz,
  processed_at timestamptz,
  rejection_reason text,
  user_reason text,
  input_data jsonb,
  deadline text,
  created_at timestamptz,
  updated_at timestamptz,
  start_date date,
  end_date date,
  quantity int,
  keyword_id uuid,
  -- 캠페인 정보
  campaign_id bigint,
  campaign_name text,
  campaign_logo text,
  campaign_status text,
  campaign_service_type text,
  campaign_refund_settings jsonb,
  campaign_ranking_field_mapping jsonb,
  -- 사용자 정보
  user_email text,
  user_full_name text,
  -- 환불 요청 정보
  refund_requests jsonb,
  -- 작업 정보
  slot_works_info jsonb,
  -- 순위 정보
  ranking_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ranking_table text;
  v_daily_ranking_table text;
  v_keyword_type text;
  v_query text;
BEGIN
  -- 서비스 타입에 따른 순위 테이블 결정
  IF p_service_type LIKE '%naver%' AND p_service_type LIKE '%traffic%' THEN
    v_ranking_table := 'naver_rankings_current';
    v_daily_ranking_table := 'naver_rankings_daily';
    v_keyword_type := 'naver';
  ELSIF p_service_type LIKE '%naver%' AND p_service_type LIKE '%place%' THEN
    v_ranking_table := 'naver_place_rankings_current';
    v_daily_ranking_table := 'naver_place_rankings_daily';
    v_keyword_type := 'place';
  ELSIF p_service_type LIKE '%coupang%' THEN
    v_ranking_table := 'coupang_rankings_current';
    v_daily_ranking_table := 'coupang_rankings_daily';
    v_keyword_type := 'coupang';
  ELSE
    v_ranking_table := 'shopping_rankings_current';
    v_daily_ranking_table := 'shopping_rankings_daily';
    v_keyword_type := 'shopping';
  END IF;

  -- 동적 쿼리 생성
  v_query := format('
    WITH campaign_data AS (
      SELECT 
        c.id,
        c.campaign_name,
        c.logo,
        c.status,
        c.service_type,
        c.refund_settings,
        c.ranking_field_mapping,
        c.add_info
      FROM campaigns c
      WHERE c.service_type = $1
    ),
    slot_data AS (
      SELECT 
        s.*,
        u.email as user_email,
        u.full_name as user_full_name,
        c.id as campaign_id,
        c.campaign_name,
        COALESCE(
          (c.add_info->>''logo_url'')::text,
          c.logo
        ) as campaign_logo,
        c.status as campaign_status,
        c.service_type as campaign_service_type,
        c.refund_settings as campaign_refund_settings,
        c.ranking_field_mapping,
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              ''id'', sr.id,
              ''status'', sr.status,
              ''refund_reason'', sr.refund_reason,
              ''approval_notes'', sr.approval_notes,
              ''request_date'', sr.request_date,
              ''approval_date'', sr.approval_date
            )
          )
          FROM slot_refund_approvals sr
          WHERE sr.slot_id = s.id
        ) as refund_requests,
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              ''work_cnt'', sw.work_cnt,
              ''date'', sw.date
            )
          )
          FROM slot_works_info sw
          WHERE sw.slot_id = s.id
        ) as slot_works_info
      FROM slots s
      JOIN campaign_data c ON s.product_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
        AND ($2 IS NULL OR s.product_id = $2)
        AND ($3 = ''all'' OR s.status = CASE WHEN $3 = ''active'' THEN ''approved'' ELSE $3 END)
        AND ($4 IS NULL OR s.created_at >= $4::timestamptz)
        AND ($5 IS NULL OR s.created_at <= $5::timestamptz)
        AND ($6 OR s.user_id = $7)
    ),
    ranking_prep AS (
      SELECT 
        sd.*,
        -- 필드 매핑에서 키워드와 상품ID 추출
        COALESCE(
          REPLACE(sd.input_data->>(COALESCE(sd.ranking_field_mapping->>''keyword'', ''검색어'')), E''\r'', ''''),
          REPLACE(sd.input_data->>''mainKeyword'', E''\r'', '''')
        ) as extracted_keyword,
        COALESCE(
          REPLACE(sd.input_data->>(COALESCE(sd.ranking_field_mapping->>''product_id'', ''코드'')), E''\r'', ''''),
          REPLACE(sd.input_data->>''mid'', E''\r'', '''')
        )::text as extracted_product_id
      FROM slot_data sd
    ),
    keyword_mapping AS (
      SELECT DISTINCT
        rp.id as slot_id,
        sk.id as keyword_uuid,
        rp.extracted_keyword,
        rp.extracted_product_id
      FROM ranking_prep rp
      LEFT JOIN search_keywords sk 
        ON sk.keyword = rp.extracted_keyword 
        AND sk.type = $8
      WHERE rp.extracted_keyword IS NOT NULL 
        AND rp.extracted_product_id IS NOT NULL
    )
    SELECT 
      rp.id as slot_id,
      rp.mat_id,
      rp.product_id,
      rp.user_id,
      rp.status,
      rp.submitted_at,
      rp.processed_at,
      rp.rejection_reason,
      rp.user_reason,
      rp.input_data,
      rp.deadline,
      rp.created_at,
      rp.updated_at,
      rp.start_date,
      rp.end_date,
      rp.quantity,
      rp.keyword_id,
      rp.campaign_id,
      rp.campaign_name,
      rp.campaign_logo,
      rp.campaign_status,
      rp.campaign_service_type,
      rp.campaign_refund_settings,
      rp.ranking_field_mapping,
      rp.user_email,
      rp.user_full_name,
      rp.refund_requests,
      rp.slot_works_info,
      CASE 
        WHEN km.keyword_uuid IS NULL THEN 
          jsonb_build_object(
            ''status'', ''not-target'',
            ''rank'', 0
          )
        WHEN r.rank IS NULL THEN
          jsonb_build_object(
            ''status'', ''no-rank'',
            ''keyword_id'', km.keyword_uuid,
            ''product_id'', km.extracted_product_id,
            ''rank'', -1
          )
        ELSE
          jsonb_build_object(
            ''status'', ''checked'',
            ''keyword_id'', r.keyword_id,
            ''product_id'', r.product_id,
            ''title'', r.title,
            ''link'', r.link,
            ''rank'', r.rank,
            ''prev_rank'', r.prev_rank,
            ''yesterday_rank'', yd.rank,
            ''lprice'', r.lprice,
            ''mall_name'', r.mall_name,
            ''brand'', r.brand,
            ''image'', r.image
          )
      END as ranking_data
    FROM ranking_prep rp
    LEFT JOIN keyword_mapping km ON km.slot_id = rp.id
    LEFT JOIN %I r ON r.keyword_id = km.keyword_uuid AND r.product_id = km.extracted_product_id
    LEFT JOIN %I yd ON yd.keyword_id = km.keyword_uuid 
      AND yd.product_id = km.extracted_product_id 
      AND yd.date = (CURRENT_DATE - INTERVAL ''1 day'')::date
    WHERE ($9 IS NULL OR 
      rp.input_data->>''productName'' ILIKE ''%%'' || $9 || ''%%'' OR
      rp.input_data->>''mid'' ILIKE ''%%'' || $9 || ''%%'' OR
      rp.input_data->>''url'' ILIKE ''%%'' || $9 || ''%%'' OR
      rp.input_data->>''mainKeyword'' ILIKE ''%%'' || $9 || ''%%'' OR
      rp.input_data->>''keyword1'' ILIKE ''%%'' || $9 || ''%%'' OR
      rp.input_data->>''keyword2'' ILIKE ''%%'' || $9 || ''%%'' OR
      rp.input_data->>''keyword3'' ILIKE ''%%'' || $9 || ''%%''
    )
    ORDER BY rp.created_at DESC
  ', v_ranking_table, v_daily_ranking_table);

  -- 쿼리 실행
  RETURN QUERY EXECUTE v_query 
  USING 
    p_service_type,
    p_campaign_id,
    p_status_filter,
    p_date_from,
    p_date_to,
    p_is_operator,
    p_user_id,
    v_keyword_type,
    p_search_term;
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION get_slots_with_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION get_slots_with_rankings TO service_role;

-- 인덱스 생성 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_slots_product_id_status ON slots(product_id, status);
CREATE INDEX IF NOT EXISTS idx_slots_user_id_created_at ON slots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slots_input_data_gin ON slots USING gin (input_data);

-- 코멘트 추가
COMMENT ON FUNCTION get_slots_with_rankings IS '슬롯과 순위 정보를 JOIN해서 가져오는 함수. JSONB 필드를 서버에서 처리하여 성능 향상';