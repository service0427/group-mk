-- =============================================================================
-- 보장형 캠페인 시스템 통합 함수 및 프로시저
-- 작성일: 2025-06-18
-- 설명: 보장형 캠페인 시스템의 모든 비즈니스 로직 함수
-- =============================================================================

-- 1. 보장형 슬롯 구매 처리 함수
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

  -- 유료캐시만 확인
  IF v_user_balance.paid_balance < v_total_amount THEN
    RAISE EXCEPTION '유료캐시가 부족합니다. 필요 금액: %, 유료캐시 잔액: %', 
      v_total_amount, 
      v_user_balance.paid_balance;
  END IF;

  -- 4. 유료캐시에서만 금액 차감
  v_free_amount := 0;
  v_paid_amount := v_total_amount;
  
  UPDATE user_balances
  SET 
    paid_balance = paid_balance - v_total_amount,
    total_balance = total_balance - v_total_amount
  WHERE user_id = p_user_id;

  -- 5. 보장형 슬롯 생성 (pending 상태로)
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
    purchase_reason
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
    p_purchase_reason
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
    '보장형 슬롯 구매 (VAT 포함) - 유료캐시: ' || v_paid_amount || '원'
  ) RETURNING id INTO v_transaction_id;

  -- 8. 견적 요청 상태 업데이트
  UPDATE guarantee_slot_requests
  SET 
    status = 'purchased',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_request_id;

  -- 9. user_cash_history에 거래 내역 추가
  -- 유료 캐시 사용 내역만 기록
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
    '보장형 슬롯 구매',
    v_slot_id,
    'paid'
  );

  -- 10. 성공 응답 반환
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

-- 2. 보장형 슬롯 승인 처리 함수
CREATE OR REPLACE FUNCTION approve_guarantee_slot(
  p_slot_id UUID,
  p_distributor_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot guarantee_slots;
  v_campaign campaigns;
BEGIN
  -- 슬롯 정보 조회 및 잠금
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
  AND distributor_id = p_distributor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;

  IF v_slot.status != 'pending' THEN
    RAISE EXCEPTION '대기 중인 슬롯만 승인할 수 있습니다. 현재 상태: %', v_slot.status;
  END IF;

  -- 캠페인 정보 조회
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = v_slot.product_id;

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'active',
    approved_at = CURRENT_TIMESTAMP,
    approved_by = p_distributor_id,
    start_date = CURRENT_DATE + INTERVAL '1 day', -- 내일부터 시작
    end_date = CASE 
      WHEN v_campaign.guarantee_unit = '일' THEN 
        CURRENT_DATE + v_slot.guarantee_count * INTERVAL '1 day'
      ELSE 
        CURRENT_DATE + INTERVAL '30 days' -- 회당인 경우 30일 기한
    END
  WHERE id = p_slot_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    p_slot_id,
    v_slot.user_id,
    'approval',
    0,
    '총판 승인 완료',
    p_distributor_id
  );

  RETURN json_build_object(
    'success', true,
    'message', '보장형 슬롯이 승인되었습니다.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 3. 보장형 슬롯 반려 처리 함수
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
BEGIN
  -- 슬롯 정보 조회 및 잠금
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
  AND distributor_id = p_distributor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;

  IF v_slot.status != 'pending' THEN
    RAISE EXCEPTION '대기 중인 슬롯만 반려할 수 있습니다. 현재 상태: %', v_slot.status;
  END IF;

  -- 홀딩 정보 조회
  SELECT * INTO v_holding
  FROM guarantee_slot_holdings
  WHERE guarantee_slot_id = p_slot_id;

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'rejected',
    rejected_at = CURRENT_TIMESTAMP,
    rejected_by = p_distributor_id,
    rejection_reason = p_rejection_reason
  WHERE id = p_slot_id;

  -- 홀딩 상태 업데이트
  UPDATE guarantee_slot_holdings
  SET status = 'refunded'
  WHERE guarantee_slot_id = p_slot_id;

  -- 사용자에게 환불 처리 (유료캐시로)
  UPDATE user_balances
  SET 
    paid_balance = paid_balance + v_holding.total_amount,
    total_balance = total_balance + v_holding.total_amount
  WHERE user_id = v_slot.user_id;
  
  -- 환불 내역 기록
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
    v_holding.total_amount,
    '보장형 슬롯 반려로 인한 환불',
    p_slot_id,
    'paid'
  );
  
  -- 견적 요청 상태도 다시 accepted로 변경 (재구매 가능하도록)
  UPDATE guarantee_slot_requests
  SET status = 'accepted'
  WHERE id = v_slot.request_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    p_slot_id,
    v_slot.user_id,
    'rejection',
    v_slot.total_amount,
    '총판 반려 - 사유: ' || p_rejection_reason,
    p_distributor_id
  );

  RETURN json_build_object(
    'success', true,
    'message', '보장형 슬롯이 반려되었습니다.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 4. 보장형 슬롯 완료 처리 함수
CREATE OR REPLACE FUNCTION complete_guarantee_slot(
  p_slot_id UUID,
  p_distributor_id UUID,
  p_work_memo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot guarantee_slots;
  v_holding guarantee_slot_holdings;
BEGIN
  -- 슬롯 정보 조회 및 잠금
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
  AND distributor_id = p_distributor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;

  IF v_slot.status != 'active' THEN
    RAISE EXCEPTION '활성 상태인 슬롯만 완료할 수 있습니다. 현재 상태: %', v_slot.status;
  END IF;

  -- 홀딩 정보 조회
  SELECT * INTO v_holding
  FROM guarantee_slot_holdings
  WHERE guarantee_slot_id = p_slot_id;

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'completed',
    completed_count = guarantee_count, -- 완료 처리
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_slot_id;

  -- 홀딩 상태 업데이트 (총판에게 지급 완료)
  UPDATE guarantee_slot_holdings
  SET 
    status = 'completed',
    user_holding_amount = 0,
    distributor_holding_amount = 0,
    distributor_released_amount = total_amount
  WHERE guarantee_slot_id = p_slot_id;

  -- 정산 내역 추가
  INSERT INTO guarantee_slot_settlements (
    guarantee_slot_id,
    confirmed_date,
    confirmed_by,
    target_rank,
    achieved_rank,
    is_guaranteed,
    amount,
    work_memo
  ) VALUES (
    p_slot_id,
    CURRENT_DATE,
    p_distributor_id,
    v_slot.target_rank,
    v_slot.target_rank, -- 목표 달성으로 처리
    TRUE,
    v_slot.total_amount,
    p_work_memo
  );

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    p_slot_id,
    v_slot.user_id,
    'completion',
    v_slot.total_amount,
    '작업 완료 처리' || CASE WHEN p_work_memo IS NOT NULL THEN ' - ' || p_work_memo ELSE '' END,
    p_distributor_id
  );

  RETURN json_build_object(
    'success', true,
    'message', '보장형 슬롯이 완료 처리되었습니다.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 5. 보장형 슬롯 환불 처리 함수
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
  v_refund_amount NUMERIC(10,2);
  v_remaining_days INTEGER;
  v_total_days INTEGER;
BEGIN
  -- 슬롯 정보 조회 및 잠금
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
  AND distributor_id = p_distributor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;

  IF v_slot.status NOT IN ('active', 'pending') THEN
    RAISE EXCEPTION '활성 또는 대기 상태인 슬롯만 환불할 수 있습니다. 현재 상태: %', v_slot.status;
  END IF;

  -- 홀딩 정보 조회
  SELECT * INTO v_holding
  FROM guarantee_slot_holdings
  WHERE guarantee_slot_id = p_slot_id;

  -- 환불 금액 계산
  IF v_slot.guarantee_unit = 'daily' THEN
    -- 일별 환불: 남은 일수에 따라 계산
    v_total_days := v_slot.guarantee_count;
    v_remaining_days := GREATEST(0, v_slot.guarantee_count - v_slot.completed_count);
    v_refund_amount := v_holding.user_holding_amount * v_remaining_days / v_total_days;
  ELSE
    -- 회수 기준: 남은 회수에 따라 계산
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
    distributor_released_amount = total_amount - v_refund_amount
  WHERE guarantee_slot_id = p_slot_id;

  -- 실제 환불 처리 (사용자 잔액에 추가 - 유료캐시로)
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
    description,
    created_by
  ) VALUES (
    p_slot_id,
    v_slot.user_id,
    'refund',
    v_refund_amount,
    '환불 처리 - 사유: ' || p_refund_reason,
    p_distributor_id
  );

  -- user_cash_history에 환불 내역 추가
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
    'paid'
  );

  RETURN json_build_object(
    'success', true,
    'message', '보장형 슬롯이 환불 처리되었습니다.',
    'refund_amount', v_refund_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- =============================================================================
-- 함수 권한 설정
-- =============================================================================

GRANT EXECUTE ON FUNCTION purchase_guarantee_slot(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_guarantee_slot(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION approve_guarantee_slot(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_guarantee_slot(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_guarantee_slot(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refund_guarantee_slot(UUID, UUID, TEXT) TO authenticated;