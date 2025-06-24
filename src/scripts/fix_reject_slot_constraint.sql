-- 보장형 슬롯 반려 시 홀딩 제약조건 오류 수정
-- 작성일: 2025-06-24
-- 문제: holding_amount_check 제약조건 위반 (user_holding_amount + distributor_holding_amount + distributor_released_amount = total_amount)
-- 해결: 반려 시 distributor_released_amount를 total_amount로 설정하여 제약조건 충족

-- reject_guarantee_slot 함수 수정
CREATE OR REPLACE FUNCTION reject_guarantee_slot(
  p_slot_id UUID,
  p_distributor_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot guarantee_slots;
  v_holding guarantee_slot_holdings;
  v_request guarantee_slot_requests;
  v_refund_amount NUMERIC(10,2);
  v_work_period INTEGER;
BEGIN
  -- 슬롯 정보 조회 (pending 또는 active 상태만 반려 가능)
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
    AND distributor_id = p_distributor_id
    AND status IN ('pending', 'active')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;
  
  -- 홀딩 정보 조회
  SELECT * INTO v_holding
  FROM guarantee_slot_holdings
  WHERE guarantee_slot_id = p_slot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '홀딩 정보를 찾을 수 없습니다.';
  END IF;
  
  -- 견적 요청 정보 조회 (작업기간 확인)
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = v_slot.request_id;
  
  -- 작업기간 결정 (guarantee_period가 있으면 사용, 없으면 guarantee_count 사용)
  v_work_period := COALESCE(v_request.guarantee_period, v_request.guarantee_count);
  
  -- 반려 시 전액 환불 (완료된 작업이 없으므로)
  v_refund_amount := v_holding.user_holding_amount;
  
  -- 슬롯 상태를 반려로 변경
  UPDATE guarantee_slots
  SET 
    status = 'rejected',
    rejected_at = CURRENT_TIMESTAMP,
    rejected_by = p_distributor_id,
    rejection_reason = p_rejection_reason
  WHERE id = p_slot_id;
  
  -- 홀딩 상태 업데이트 
  -- holding_amount_check 제약조건을 충족하기 위해
  -- user_holding_amount + distributor_holding_amount + distributor_released_amount = total_amount
  -- 반려 시에는 모든 금액이 환불되므로 distributor_released_amount = total_amount로 설정
  UPDATE guarantee_slot_holdings
  SET 
    status = 'refunded',
    user_holding_amount = 0,
    distributor_holding_amount = 0,
    distributor_released_amount = total_amount  -- 전체 금액을 released로 처리
  WHERE guarantee_slot_id = p_slot_id;
  
  -- 유료 캐시로 환불
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
    '보장형 슬롯 반려로 인한 환불'
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
    '보장형 슬롯 반려로 인한 환불',
    p_slot_id,
    'paid'  -- 유료 캐시로 환불
  );
  
  RETURN json_build_object(
    'success', true,
    'message', '슬롯이 반려되고 환불 처리되었습니다.',
    'refund_amount', v_refund_amount,
    'work_period', v_work_period,
    'rejection_reason', p_rejection_reason
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION reject_guarantee_slot TO authenticated;