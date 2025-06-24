-- 보장형 슬롯 승인 시 작업기간 반영 수정
-- 작성일: 2025-06-24
-- 문제: 회당 보장형의 경우 고정 30일로 설정됨
-- 해결: guarantee_period 사용하여 실제 작업기간 반영

-- approve_guarantee_slot 함수 수정
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
  v_request guarantee_slot_requests;
  v_work_period INTEGER;
BEGIN
  -- 슬롯 정보 조회
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
    AND distributor_id = p_distributor_id
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;
  
  -- 캠페인 정보 조회
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = v_slot.product_id;
  
  -- 견적 요청 정보 조회 (작업기간 확인)
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = v_slot.request_id;
  
  -- 작업기간 결정
  v_work_period := COALESCE(v_request.guarantee_period, v_slot.guarantee_count);
  
  -- 슬롯 상태를 승인으로 변경하고 기간 설정
  UPDATE guarantee_slots
  SET 
    status = 'active',
    approved_at = CURRENT_TIMESTAMP,
    approved_by = p_distributor_id,
    start_date = CURRENT_DATE + INTERVAL '1 day', -- 내일부터 시작
    end_date = CURRENT_DATE + (v_work_period || ' days')::INTERVAL -- 작업기간 반영
  WHERE id = p_slot_id;
  
  -- 홀딩 상태도 활성화
  UPDATE guarantee_slot_holdings
  SET status = 'holding'
  WHERE guarantee_slot_id = p_slot_id;
  
  -- 알림은 별도 처리
  
  RETURN json_build_object(
    'success', true,
    'message', '보장형 슬롯이 승인되었습니다.',
    'start_date', CURRENT_DATE + INTERVAL '1 day',
    'end_date', CURRENT_DATE + (v_work_period || ' days')::INTERVAL,
    'work_period', v_work_period
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION approve_guarantee_slot TO authenticated;