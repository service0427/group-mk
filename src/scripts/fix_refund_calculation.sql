-- 보장형 슬롯 환불 시 작업기간으로 계산하도록 수정
-- 작성일: 2025-01-24
-- 문제: guarantee_count(보장일수)로 계산해서 환불 금액이 잘못 계산됨

-- refund_guarantee_slot 함수 수정
CREATE OR REPLACE FUNCTION refund_guarantee_slot(
  p_slot_id UUID,
  p_distributor_id UUID,
  p_refund_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot guarantee_slots;
  v_holding guarantee_slot_holdings;
  v_total_days INTEGER;
  v_remaining_days INTEGER;
  v_refund_amount NUMERIC(10,2);
  v_work_period INTEGER;
  v_request guarantee_slot_requests;
BEGIN
  -- 슬롯 정보 조회
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
    AND distributor_id = p_distributor_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;
  
  -- 활성 또는 대기 상태인 슬롯만 환불 가능
  IF v_slot.status NOT IN ('active', 'pending') THEN
    RAISE EXCEPTION '활성 또는 대기 상태인 슬롯만 환불할 수 있습니다. 현재 상태: %', v_slot.status;
  END IF;

  -- 홀딩 정보 조회
  SELECT * INTO v_holding
  FROM guarantee_slot_holdings
  WHERE guarantee_slot_id = p_slot_id;

  -- 원래 견적 요청 정보에서 작업기간 가져오기
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = v_slot.request_id;

  -- 작업기간 결정
  v_work_period := COALESCE(v_request.guarantee_period, v_slot.guarantee_count);

  -- 환불 금액 계산
  IF v_slot.guarantee_unit = 'daily' THEN
    -- 일별 환불: 작업기간 대비 남은 일수에 따라 계산
    v_total_days := v_work_period;  -- 작업기간 사용
    v_remaining_days := GREATEST(0, v_work_period - v_slot.completed_count);
    v_refund_amount := v_holding.user_holding_amount * v_remaining_days / v_total_days;
  ELSE
    -- 회수 기준: 보장횟수는 그대로 사용
    v_refund_amount := v_holding.user_holding_amount * 
      GREATEST(0, v_slot.guarantee_count - v_slot.completed_count) / v_slot.guarantee_count;
  END IF;

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'cancelled',
    cancellation_reason = p_refund_reason,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_slot_id;

  -- 홀딩 상태 업데이트
  UPDATE guarantee_slot_holdings
  SET 
    status = 'refunded',
    user_holding_amount = 0,
    distributor_holding_amount = 0,
    distributor_released_amount = v_holding.total_amount - v_refund_amount
  WHERE guarantee_slot_id = p_slot_id;

  -- 실제 환불 처리 (유료 캐시로 환불)
  UPDATE user_balances
  SET 
    paid_balance = paid_balance + v_refund_amount,
    total_balance = total_balance + v_refund_amount
  WHERE user_id = v_slot.user_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    p_slot_id,
    v_slot.user_id,
    'refund',
    v_refund_amount,
    p_refund_reason
  );

  -- 캐시 히스토리 기록
  INSERT INTO user_cash_history (
    user_id,
    transaction_type,
    amount,
    description,
    reference_id,
    balance_type
  ) VALUES (
    v_slot.user_id,
    'refund',
    v_refund_amount,
    '보장형 슬롯 환불',
    p_slot_id,
    'paid'  -- 유료 캐시로 환불
  );

  -- 알림은 별도 처리

  RETURN json_build_object(
    'success', true,
    'message', '환불이 처리되었습니다.',
    'refund_amount', v_refund_amount,
    'work_period', v_work_period,
    'completed_count', v_slot.completed_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;