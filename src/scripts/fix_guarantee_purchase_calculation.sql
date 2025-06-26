-- 보장형 슬롯 구매 금액 계산 수정
-- 작성일: 2025-06-27
-- 수정사항: 작업기간이 아닌 보장 일수로 계산하도록 변경

-- purchase_guarantee_slot 함수 수정 (유료캐시만 사용 버전)
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
  v_total_amount NUMERIC(10,2);
  v_slot_id UUID;
BEGIN
  -- 1. 요청 정보 확인
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = p_request_id
    AND user_id = p_user_id
    AND status = 'accepted'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '유효하지 않은 요청이거나 권한이 없습니다.';
  END IF;
  
  -- 2. 캠페인 정보 확인
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = v_request.campaign_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '캠페인 정보를 찾을 수 없습니다.';
  END IF;
  
  -- 3. 총 금액 계산 (VAT 포함) - 보장 일수 기준
  v_total_amount := FLOOR(v_request.final_daily_amount * v_request.guarantee_count * 1.1);
  
  -- 4. 사용자 잔액 확인 (유료캐시만)
  SELECT * INTO v_user_balance
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND OR v_user_balance.paid_balance < v_total_amount THEN
    RAISE EXCEPTION '유료캐시 잔액이 부족합니다. 필요금액: %, 유료캐시 잔액: %', 
      v_total_amount, COALESCE(v_user_balance.paid_balance, 0);
  END IF;
  
  -- 5. 유료캐시에서만 차감
  UPDATE user_balances
  SET 
    paid_balance = paid_balance - v_total_amount,
    total_balance = total_balance - v_total_amount
  WHERE user_id = p_user_id;
  
  -- 6. 보장형 슬롯 생성
  v_slot_id := gen_random_uuid();
  
  INSERT INTO guarantee_slots (
    id,
    request_id,
    user_id,
    product_id,
    distributor_id,
    target_rank,
    guarantee_count,
    guarantee_unit,
    daily_guarantee_amount,
    total_amount,
    status,
    keyword_id,
    input_data,
    start_date,
    end_date,
    quantity,
    user_reason,
    additional_requirements,
    purchase_reason
  ) VALUES (
    v_slot_id,
    p_request_id,
    p_user_id,
    v_request.campaign_id,
    v_request.distributor_id,
    v_request.target_rank,
    v_request.guarantee_count,
    COALESCE(v_campaign.guarantee_unit, 'daily'),
    v_request.final_daily_amount,
    v_total_amount,
    'pending',
    v_request.keyword_id,
    v_request.input_data,
    v_request.start_date,
    v_request.end_date,
    v_request.quantity,
    v_request.user_reason,
    v_request.additional_requirements,
    p_purchase_reason
  );
  
  -- 7. 요청 상태 업데이트
  UPDATE guarantee_slot_requests
  SET status = 'purchased'
  WHERE id = p_request_id;
  
  -- 8. 홀딩 금액 생성 (사용자가 전액 홀딩)
  INSERT INTO guarantee_slot_holdings (
    guarantee_slot_id,
    user_id,
    total_amount,
    user_holding_amount,
    distributor_holding_amount,
    distributor_released_amount,
    status
  ) VALUES (
    v_slot_id,
    p_user_id,
    v_total_amount,
    v_total_amount,
    0,
    0,
    'holding'
  );
  
  -- 9. 캐시 히스토리 기록
  INSERT INTO user_cash_history (
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    balance_type,
    transaction_at
  ) VALUES (
    p_user_id,
    'purchase',
    -v_total_amount,
    '보장형 슬롯 구매: ' || v_campaign.campaign_name,
    v_slot_id,
    'paid',
    NOW()
  );
  
  -- 10. 성공 응답 반환
  RETURN json_build_object(
    'success', true,
    'slot_id', v_slot_id,
    'total_amount', v_total_amount,
    'message', '보장형 슬롯 구매가 완료되었습니다.'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 롤백
    RAISE;
END;
$$;

COMMENT ON FUNCTION purchase_guarantee_slot IS '보장형 슬롯 구매 - 보장 일수 기준 계산';