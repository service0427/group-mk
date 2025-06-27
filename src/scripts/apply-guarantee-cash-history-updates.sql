-- 보장형 슬롯 캐시 내역 표시 개선을 위한 통합 스크립트
-- 작성일: 2025-06-27
-- 설명: 뷰와 함수를 업데이트하여 보장형 슬롯 구매 시 캠페인명과 서비스 타입이 표시되도록 함

-- =============================================================================
-- 1. User Cash History View 업데이트 (보장형 슬롯 포함)
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
-- 2. purchase_guarantee_slot 함수 업데이트 (캠페인명 포함)
-- =============================================================================

CREATE OR REPLACE FUNCTION purchase_guarantee_slot(
  p_request_id UUID,
  p_user_id UUID,
  p_purchase_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request guarantee_slot_requests;
  v_campaign campaigns;
  v_user_balance user_balances;
  v_total_amount BIGINT;
  v_paid_amount BIGINT;
  v_free_amount BIGINT;
  v_slot_id UUID;
  v_holding_id UUID;
  v_transaction_id UUID;
  v_description TEXT;
BEGIN
  -- 1. 견적 요청 정보 조회 및 유효성 검증
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '견적 요청을 찾을 수 없습니다.';
  END IF;

  IF v_request.status != 'accepted' THEN
    RAISE EXCEPTION '승인된 견적만 구매할 수 있습니다. 현재 상태: %', v_request.status;
  END IF;

  IF v_request.user_id != p_user_id THEN
    RAISE EXCEPTION '본인의 견적만 구매할 수 있습니다.';
  END IF;

  -- 2. 캠페인 정보 조회
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = v_request.campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '캠페인 정보를 찾을 수 없습니다.';
  END IF;

  -- 3. 총 금액 계산 (단가 * 보장 횟수 * 1.1 VAT 포함)
  v_total_amount := FLOOR(v_request.final_daily_amount * v_request.guarantee_count * 1.1);

  -- 4. 사용자 잔액 조회 및 검증
  SELECT * INTO v_user_balance
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '사용자 잔액 정보를 찾을 수 없습니다.';
  END IF;

  -- 유료캐시만 확인
  IF v_user_balance.paid_balance < v_total_amount THEN
    RAISE EXCEPTION '유료캐시가 부족합니다. 필요 금액: %, 유료캐시 잔액: %', 
      v_total_amount, 
      v_user_balance.paid_balance;
  END IF;

  -- 5. 유료캐시에서만 금액 차감
  v_free_amount := 0;
  v_paid_amount := v_total_amount;
  
  UPDATE user_balances
  SET 
    paid_balance = paid_balance - v_total_amount,
    total_balance = total_balance - v_total_amount
  WHERE user_id = p_user_id;

  -- 6. 보장형 슬롯 생성 (pending 상태로)
  INSERT INTO guarantee_slots (
    id,
    request_id,
    user_id,
    product_id,
    distributor_id,
    target_rank,
    guarantee_count,
    completed_count,
    daily_guarantee_amount,
    total_amount,
    status,
    purchase_reason,
    keyword_id,
    input_data,
    start_date,
    end_date,
    quantity,
    user_reason,
    additional_requirements
  ) VALUES (
    gen_random_uuid(),
    v_request.id,
    v_request.user_id,
    v_request.campaign_id,
    v_request.distributor_id,
    v_request.target_rank,
    v_request.guarantee_count,
    0,
    v_request.final_daily_amount,
    FLOOR(v_request.final_daily_amount * v_request.guarantee_count), -- VAT 제외 금액
    'pending',
    p_purchase_reason,
    v_request.keyword_id,
    v_request.input_data,
    v_request.start_date,
    v_request.end_date,
    v_request.quantity,
    v_request.user_reason,
    v_request.additional_requirements
  ) RETURNING id INTO v_slot_id;

  -- 7. 홀딩 금액 설정
  INSERT INTO guarantee_slot_holdings (
    id,
    guarantee_slot_id,
    user_id,
    total_amount,
    user_holding_amount,
    distributor_holding_amount,
    distributor_released_amount,
    status
  ) VALUES (
    gen_random_uuid(),
    v_slot_id,
    p_user_id,
    v_total_amount,
    v_total_amount,
    0,
    0,
    'holding'
  ) RETURNING id INTO v_holding_id;

  -- 8. 트랜잭션 기록
  INSERT INTO guarantee_slot_transactions (
    id,
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    gen_random_uuid(),
    v_slot_id,
    p_user_id,
    'purchase',
    v_total_amount,
    v_user_balance.total_balance,
    v_user_balance.total_balance - v_total_amount,
    '보장형 슬롯 구매 (VAT 포함) - 유료캐시: ' || v_paid_amount || '원'
  ) RETURNING id INTO v_transaction_id;

  -- 9. 견적 요청 상태 업데이트
  UPDATE guarantee_slot_requests
  SET 
    status = 'purchased',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_request_id;

  -- 10. user_cash_history에 거래 내역 추가
  -- 캠페인명 포함하여 description 생성
  v_description := '[보장형] ' || v_campaign.campaign_name;
  
  INSERT INTO user_cash_history (
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    balance_type
  ) VALUES (
    p_user_id,
    'purchase',
    -v_paid_amount,
    v_description,
    v_slot_id,
    'paid'
  );

  -- 11. 성공 응답 반환
  RETURN json_build_object(
    'success', true,
    'slot_id', v_slot_id,
    'total_amount', v_total_amount,
    'paid_amount', v_paid_amount,
    'free_amount', v_free_amount,
    'transaction_id', v_transaction_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 롤백
    RAISE;
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION purchase_guarantee_slot TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_guarantee_slot TO service_role;