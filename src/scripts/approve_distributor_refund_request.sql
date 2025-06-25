-- 사용자가 총판의 환불 요청을 승인하는 함수
CREATE OR REPLACE FUNCTION approve_distributor_refund_request(
  p_slot_id UUID,
  p_request_id TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot guarantee_slots;
  v_request guarantee_slot_requests;
  v_refund_requests JSONB;
  v_refund_request JSONB;
  v_request_index INTEGER;
  v_refund_amount NUMERIC;
  v_holding guarantee_slot_holdings;
  v_current_paid_balance NUMERIC;
BEGIN
  -- 슬롯 정보 조회 (사용자 권한 확인 포함)
  SELECT gs.*, gsr.user_id INTO v_slot
  FROM guarantee_slots gs
  JOIN guarantee_slot_requests gsr ON gs.request_id = gsr.id
  WHERE gs.id = p_slot_id
    AND gsr.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '슬롯을 찾을 수 없거나 권한이 없습니다.'
    );
  END IF;
  
  -- 환불 요청 찾기
  v_refund_requests := COALESCE(v_slot.refund_requests, '[]'::jsonb);
  v_request_index := -1;
  
  FOR i IN 0..jsonb_array_length(v_refund_requests) - 1 LOOP
    IF v_refund_requests->i->>'id' = p_request_id 
       AND v_refund_requests->i->>'status' = 'pending_user_confirmation' THEN
      v_refund_request := v_refund_requests->i;
      v_request_index := i;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_request_index = -1 THEN
    RETURN json_build_object(
      'success', false,
      'message', '환불 요청을 찾을 수 없거나 이미 처리되었습니다.'
    );
  END IF;
  
  -- 환불 금액 가져오기
  v_refund_amount := (v_refund_request->>'refund_amount')::NUMERIC;
  
  -- 홀딩 정보 확인
  SELECT * INTO v_holding
  FROM guarantee_slot_holdings
  WHERE guarantee_slot_id = p_slot_id
    AND status = 'holding'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '홀딩 정보를 찾을 수 없습니다.'
    );
  END IF;
  
  -- 환불 금액이 사용자 홀딩 금액보다 큰지 확인
  IF v_refund_amount > v_holding.user_holding_amount THEN
    v_refund_amount := v_holding.user_holding_amount; -- 사용자 홀딩 금액으로 제한
  END IF;
  
  -- 트랜잭션 시작
  BEGIN
    -- 1. 환불 요청 상태 업데이트
    v_refund_request := v_refund_request || jsonb_build_object(
      'status', 'approved',
      'approval_date', now()::timestamp,
      'approver_id', p_user_id,
      'approval_notes', '사용자가 환불을 승인했습니다.'
    );
    
    v_refund_requests := jsonb_set(
      v_refund_requests,
      ARRAY[v_request_index::text],
      v_refund_request
    );
    
    -- 2. 슬롯 상태 업데이트
    UPDATE guarantee_slots
    SET 
      status = 'cancelled',
      refund_requests = v_refund_requests,
      updated_at = now()
    WHERE id = p_slot_id;
    
    -- 3. 홀딩 상태 업데이트
    UPDATE guarantee_slot_holdings
    SET 
      status = CASE 
        WHEN v_holding.user_holding_amount - v_refund_amount = 0 THEN 'refunded'
        ELSE 'partial_released'
      END,
      user_holding_amount = v_holding.user_holding_amount - v_refund_amount,
      total_amount = v_holding.total_amount - v_refund_amount,
      updated_at = now()
    WHERE id = v_holding.id;
    
    -- 4. 사용자 캐시 잔액 조회
    SELECT COALESCE(paid_balance, 0) INTO v_current_paid_balance
    FROM user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- 레코드가 없으면 0으로 설정
    IF NOT FOUND THEN
      v_current_paid_balance := 0;
    END IF;
    
    -- 캐시 잔액 업데이트
    INSERT INTO user_balances (user_id, paid_balance, free_balance, total_balance, updated_at)
    VALUES (p_user_id, v_refund_amount, 0, v_refund_amount, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      paid_balance = user_balances.paid_balance + v_refund_amount,
      total_balance = user_balances.paid_balance + user_balances.free_balance + v_refund_amount,
      updated_at = now();
    
    -- 5. 캐시 거래 내역 기록
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
      'refund',
      v_refund_amount,
      '보장형 슬롯 환불 - ' || COALESCE(v_refund_request->>'refund_reason', '총판 요청'),
      p_slot_id,
      'paid',
      now()
    );
    
    -- 6. 거래 로그 기록
    INSERT INTO guarantee_slot_transactions (
      guarantee_slot_id,
      user_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description
    ) VALUES (
      p_slot_id,
      p_user_id,
      'refund',
      v_refund_amount,
      v_current_paid_balance,
      v_current_paid_balance + v_refund_amount,
      '보장형 슬롯 환불 승인'
    );
    
    RETURN json_build_object(
      'success', true,
      'message', '환불이 승인되었습니다.',
      'refund_amount', v_refund_amount
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
  
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION approve_distributor_refund_request TO authenticated;