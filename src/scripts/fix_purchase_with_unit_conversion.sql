-- purchase_guarantee_slot 함수 수정 - guarantee_unit 한글 변환 포함
-- 작성일: 2025-01-24
-- 문제: campaigns.guarantee_unit이 '일'이지만 guarantee_slots는 'daily'만 허용

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
  v_user_balance user_balances;
  v_total_amount NUMERIC(10,2);
  v_free_amount NUMERIC(10,2);
  v_paid_amount NUMERIC(10,2);
  v_slot_id UUID;
  v_campaign campaigns;
  v_guarantee_unit VARCHAR(10);
BEGIN
  -- 1. 견적 요청 정보 조회
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = p_request_id
    AND status = 'accepted'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '유효하지 않은 견적 요청입니다.';
  END IF;

  -- 캠페인 정보 조회
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = v_request.campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '유효하지 않은 견적 요청입니다.';
  END IF;

  IF v_request.user_id != p_user_id THEN
    RAISE EXCEPTION '본인의 견적만 구매할 수 있습니다.';
  END IF;

  -- guarantee_unit 변환 (한글 -> 영문)
  v_guarantee_unit := CASE 
    WHEN v_campaign.guarantee_unit = '일' THEN 'daily'
    WHEN v_campaign.guarantee_unit = '회' THEN 'count'
    ELSE COALESCE(v_campaign.guarantee_unit, 'daily')
  END;

  -- 2. 총 금액 계산 (단가 * 보장 일수 * 1.1 VAT 포함)
  v_total_amount := FLOOR(v_request.final_daily_amount * v_request.guarantee_count * 1.1);

  -- 3. 사용자 잔액 조회 및 검증
  SELECT * INTO v_user_balance
  FROM user_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '사용자 잔액 정보를 찾을 수 없습니다.';
  END IF;

  IF v_user_balance.total_balance < v_total_amount THEN
    RAISE EXCEPTION '잔액이 부족합니다. 필요 금액: %, 현재 잔액: %', 
      v_total_amount, 
      v_user_balance.total_balance;
  END IF;

  -- 4. 무료 캐시 우선 사용하여 금액 차감
  IF v_user_balance.free_balance >= v_total_amount THEN
    -- 무료 캐시로 전액 결제
    v_free_amount := v_total_amount;
    v_paid_amount := 0;
    
    UPDATE user_balances
    SET 
      free_balance = free_balance - v_total_amount,
      total_balance = total_balance - v_total_amount
    WHERE user_id = p_user_id;
  ELSE
    -- 무료 캐시 전액 사용 + 유료 캐시에서 부족분 차감
    v_free_amount := v_user_balance.free_balance;
    v_paid_amount := v_total_amount - v_free_amount;
    
    UPDATE user_balances
    SET 
      free_balance = 0,
      paid_balance = paid_balance - v_paid_amount,
      total_balance = total_balance - v_paid_amount
    WHERE user_id = p_user_id;
  END IF;

  -- 5. 보장형 슬롯 생성 (pending 상태로)
  INSERT INTO guarantee_slots (
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
    purchase_reason
  ) VALUES (
    p_request_id,
    p_user_id,
    v_request.campaign_id,
    v_request.distributor_id,
    v_request.target_rank,
    v_request.guarantee_count,
    v_guarantee_unit,  -- 변환된 값 사용
    v_request.final_daily_amount,
    v_request.final_daily_amount * v_work_period,  -- 작업기간으로 계산
    'pending',
    v_request.keyword_id,
    v_request.input_data,
    v_request.start_date,
    v_request.end_date,
    p_purchase_reason
  )
  RETURNING id INTO v_slot_id;

  -- 6. 홀딩 정보 생성 (VAT 제외 금액으로 홀딩)
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
    v_request.final_daily_amount * v_work_period,  -- VAT 제외 금액
    v_request.final_daily_amount * v_work_period,  -- 초기에는 전액 사용자 홀딩
    0,
    0,
    'holding'
  );

  -- 7. 거래 내역 기록
  INSERT INTO guarantee_slot_transactions (
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    v_slot_id,
    p_user_id,
    'purchase',
    v_total_amount,
    '보장형 슬롯 구매'
  );

  -- 8. 캐시 사용 내역 기록
  IF v_free_amount > 0 THEN
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
      -v_free_amount,
      '보장형 슬롯 구매 (무료 캐시)',
      v_slot_id,
      'free'
    );
  END IF;

  IF v_paid_amount > 0 THEN
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
      '보장형 슬롯 구매 (유료 캐시)',
      v_slot_id,
      'paid'
    );
  END IF;

  -- 9. 견적 요청 상태를 구매 완료로 변경
  UPDATE guarantee_slot_requests
  SET status = 'purchased'
  WHERE id = p_request_id;

  -- 10. 결과 반환
  RETURN json_build_object(
    'success', true,
    'message', '보장형 슬롯 구매가 완료되었습니다.',
    'slot_id', v_slot_id,
    'total_amount', v_total_amount,
    'free_amount_used', v_free_amount,
    'paid_amount_used', v_paid_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 롤백
    RAISE;
END;
$$;