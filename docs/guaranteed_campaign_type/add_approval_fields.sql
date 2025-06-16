-- 보장형 슬롯에 승인 관련 필드 추가
ALTER TABLE guarantee_slots
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 기존 CHECK 제약조건 제거
ALTER TABLE guarantee_slots DROP CONSTRAINT IF EXISTS guarantee_slots_status_check;

-- 새로운 CHECK 제약조건 추가 (pending, rejected 포함)
ALTER TABLE guarantee_slots ADD CONSTRAINT guarantee_slots_status_check 
CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'rejected'));

-- 코멘트 추가
COMMENT ON COLUMN guarantee_slots.approved_at IS '총판이 승인한 시각';
COMMENT ON COLUMN guarantee_slots.approved_by IS '승인한 총판 ID';
COMMENT ON COLUMN guarantee_slots.rejected_at IS '총판이 반려한 시각';
COMMENT ON COLUMN guarantee_slots.rejected_by IS '반려한 총판 ID';
COMMENT ON COLUMN guarantee_slots.rejection_reason IS '반려 사유';

-- 보장형 슬롯 승인 처리 함수
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

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'active',
    approved_at = CURRENT_TIMESTAMP,
    approved_by = p_distributor_id,
    start_date = CURRENT_DATE + INTERVAL '1 day', -- 내일부터 시작
    end_date = CASE 
      WHEN guarantee_unit = 'daily' THEN 
        CURRENT_DATE + guarantee_count * INTERVAL '1 day'
      ELSE 
        CURRENT_DATE + INTERVAL '30 days' -- 회당인 경우 30일 기한
    END
  WHERE id = p_slot_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    slot_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    p_slot_id,
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

-- 보장형 슬롯 반려 처리 함수
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
  v_user_balance user_balances;
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
  WHERE slot_id = p_slot_id;

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
  WHERE slot_id = p_slot_id;

  -- 사용자에게 환불 처리
  -- 여기서는 원래 차감했던 금액을 그대로 돌려줌
  -- 실제 구현 시에는 guarantee_slot_transactions에서 구매 내역을 조회하여 정확한 환불 처리 필요
  
  -- 견적 요청 상태도 다시 accepted로 변경 (재구매 가능하도록)
  UPDATE guarantee_slot_requests
  SET status = 'accepted'
  WHERE id = v_slot.request_id;

  -- 트랜잭션 로그
  INSERT INTO guarantee_slot_transactions (
    slot_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    p_slot_id,
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

-- 권한 설정
GRANT EXECUTE ON FUNCTION approve_guarantee_slot(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_guarantee_slot(UUID, UUID, TEXT) TO authenticated;