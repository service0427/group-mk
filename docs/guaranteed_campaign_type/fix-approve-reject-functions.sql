-- 보장형 슬롯 승인 처리 함수 수정
-- guarantee_unit 컬럼 참조를 제거하고 캠페인 정보에서 가져오도록 수정
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
    start_date = COALESCE(start_date, CURRENT_DATE + INTERVAL '1 day'), -- 이미 설정된 경우 유지
    end_date = COALESCE(end_date, 
      CASE 
        WHEN v_campaign.guarantee_unit = 'daily' THEN 
          CURRENT_DATE + guarantee_count * INTERVAL '1 day'
        ELSE 
          CURRENT_DATE + INTERVAL '30 days' -- 회당인 경우 30일 기한
      END
    )
  WHERE id = p_slot_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    id,
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    gen_random_uuid(),
    p_slot_id,
    v_slot.user_id,
    'approval',
    0,
    '총판 승인 완료'
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

-- 보장형 슬롯 반려 처리 함수 수정
-- guarantee_slot_holdings 테이블 참조 수정
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
  v_refund_amount BIGINT;
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

  IF FOUND THEN
    v_refund_amount := v_holding.total_amount;
    
    -- 홀딩 상태 업데이트
    UPDATE guarantee_slot_holdings
    SET status = 'refunded'
    WHERE guarantee_slot_id = p_slot_id;

    -- 사용자에게 환불 처리
    UPDATE user_balances
    SET 
      total_balance = total_balance + v_refund_amount,
      free_balance = free_balance + v_refund_amount -- 환불은 무료 캐시로
    WHERE user_id = v_slot.user_id;

    -- 캐시 사용 내역 기록
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
      'free'
    );
  ELSE
    v_refund_amount := FLOOR(v_slot.total_amount * 1.1); -- VAT 포함 금액으로 추정
  END IF;

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'rejected',
    rejected_at = CURRENT_TIMESTAMP,
    rejected_by = p_distributor_id,
    rejection_reason = p_rejection_reason
  WHERE id = p_slot_id;

  -- 견적 요청 상태도 다시 accepted로 변경 (재구매 가능하도록)
  UPDATE guarantee_slot_requests
  SET status = 'accepted'
  WHERE id = v_slot.request_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    id,
    guarantee_slot_id,
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    gen_random_uuid(),
    p_slot_id,
    v_slot.user_id,
    'rejection',
    v_refund_amount,
    '총판 반려 - 사유: ' || p_rejection_reason
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

-- 권한 설정
GRANT EXECUTE ON FUNCTION approve_guarantee_slot(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_guarantee_slot(UUID, UUID, TEXT) TO authenticated;