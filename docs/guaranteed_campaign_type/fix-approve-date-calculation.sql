-- 보장형 슬롯 승인 처리 함수 날짜 계산 수정
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
  v_start_date DATE;
  v_end_date DATE;
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

  -- 날짜 계산
  -- 시작일: 내일
  v_start_date := CURRENT_DATE + INTERVAL '1 day';
  
  -- 종료일 계산
  IF v_campaign.guarantee_unit = 'daily' THEN 
    -- 일 단위: 시작일로부터 (guarantee_count - 1)일 후
    v_end_date := v_start_date + (v_slot.guarantee_count - 1) * INTERVAL '1 day';
  ELSE 
    -- 회 단위: 시작일로부터 29일 후 (총 30일)
    v_end_date := v_start_date + INTERVAL '29 days';
  END IF;

  -- 슬롯 상태 업데이트
  UPDATE guarantee_slots
  SET 
    status = 'active',
    approved_at = CURRENT_TIMESTAMP,
    approved_by = p_distributor_id,
    start_date = COALESCE(start_date, v_start_date), -- 이미 설정된 경우 유지
    end_date = COALESCE(end_date, v_end_date) -- 이미 설정된 경우 유지
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

-- 권한 설정
GRANT EXECUTE ON FUNCTION approve_guarantee_slot(UUID, UUID) TO authenticated;