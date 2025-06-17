-- 보장형 슬롯 구매 시 pending 상태로 생성되도록 수정
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
  v_total_amount BIGINT;
  v_paid_amount BIGINT;
  v_free_amount BIGINT;
  v_slot_id UUID;
  v_holding_id UUID;
  v_transaction_id UUID;
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

  -- 2. 총 금액 계산 (단가 * 보장 횟수 * 1.1 VAT 포함)
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
      total_balance = total_balance - v_total_amount
    WHERE user_id = p_user_id;
  END IF;

  -- 5. 보장형 슬롯 생성 (status를 'pending'으로 변경)
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
    'pending', -- active에서 pending으로 변경
    p_purchase_reason,
    v_request.keyword_id,
    v_request.input_data,
    v_request.start_date,
    v_request.end_date,
    v_request.quantity,
    v_request.user_reason,
    v_request.additional_requirements
  ) RETURNING id INTO v_slot_id;

  -- 6. 홀딩 금액 설정
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

  -- 7. 트랜잭션 기록
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
    '보장형 슬롯 구매 - ' || coalesce(p_purchase_reason, '사용자 구매')
  ) RETURNING id INTO v_transaction_id;

  -- 8. 캐시 사용 내역 기록
  -- 무료 캐시 사용 내역
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

  -- 유료 캐시 사용 내역
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

  -- 9. 견적 요청 상태 업데이트
  UPDATE guarantee_slot_requests
  SET status = 'purchased'
  WHERE id = p_request_id;

  -- 10. 성공 응답 반환
  RETURN json_build_object(
    'success', true,
    'slot_id', v_slot_id,
    'total_amount', v_total_amount,
    'free_amount_used', v_free_amount,
    'paid_amount_used', v_paid_amount,
    'message', '보장형 슬롯 구매가 완료되었습니다. 총판 승인 대기 중입니다.'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 롤백 (자동)
    RAISE;
END;
$$;