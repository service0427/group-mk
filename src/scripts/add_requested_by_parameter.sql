-- add_refund_request 함수에 p_requested_by 파라미터 추가
-- 작성일: 2025-06-24
-- 목적: 총판이 환불을 시작하는 경우와 사용자가 환불을 신청하는 경우를 구분

-- 기존 함수를 DROP하고 새로 생성
DROP FUNCTION IF EXISTS add_refund_request(uuid, uuid, text, numeric);

CREATE OR REPLACE FUNCTION add_refund_request(
  p_slot_id UUID,
  p_user_id UUID,
  p_refund_reason TEXT,
  p_refund_amount NUMERIC(10,2),
  p_requested_by TEXT DEFAULT 'user'  -- 새로운 파라미터 추가
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_request JSONB;
  v_request_id TEXT;
  v_slot guarantee_slots;
  v_request guarantee_slot_requests;
  v_total_amount NUMERIC(10,2);
  v_completed_amount NUMERIC(10,2);
  v_refund_amount NUMERIC(10,2);
  v_work_period INTEGER;
  v_completed_days INTEGER;
  v_actual_user_id UUID;
BEGIN
  -- p_requested_by가 'distributor'인 경우, p_user_id는 총판 ID이므로 슬롯의 실제 사용자 ID 조회
  IF p_requested_by = 'distributor' THEN
    SELECT * INTO v_slot
    FROM guarantee_slots
    WHERE id = p_slot_id
      AND distributor_id = p_user_id;  -- 총판 ID로 검증
    
    IF NOT FOUND THEN
      RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
    END IF;
    
    v_actual_user_id := v_slot.user_id;  -- 실제 사용자 ID
  ELSE
    -- 사용자가 요청한 경우
    SELECT * INTO v_slot
    FROM guarantee_slots
    WHERE id = p_slot_id
      AND user_id = p_user_id;
      
    IF NOT FOUND THEN
      RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
    END IF;
    
    v_actual_user_id := p_user_id;
  END IF;

  -- 이미 대기 중인 환불 요청이 있는지 확인
  IF has_pending_refund_request(p_slot_id) THEN
    RAISE EXCEPTION '이미 처리 중인 환불 요청이 있습니다.';
  END IF;

  -- 원래 견적 요청 정보에서 작업기간과 일일금액 가져오기
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = v_slot.request_id;

  -- 작업기간 결정
  v_work_period := COALESCE(v_request.guarantee_period, v_slot.guarantee_count);

  -- 완료된 일수 계산
  IF v_slot.start_date IS NOT NULL AND v_slot.start_date <= CURRENT_DATE THEN
    v_completed_days := LEAST(
      EXTRACT(EPOCH FROM (CURRENT_DATE - v_slot.start_date::date)) / 86400,
      v_work_period
    )::INTEGER;
  ELSE
    v_completed_days := 0;
  END IF;

  -- 환불 금액 계산 (VAT 포함) - 백엔드에서 직접 계산
  v_total_amount := v_request.final_daily_amount * v_work_period * 1.1;
  v_completed_amount := v_request.final_daily_amount * v_completed_days * 1.1;
  v_refund_amount := GREATEST(0, v_total_amount - v_completed_amount);

  -- 미래 시작인 경우 전액 환불
  IF v_slot.start_date IS NOT NULL AND v_slot.start_date > CURRENT_DATE THEN
    v_refund_amount := v_total_amount;
  END IF;
  
  -- 환불 요청 ID 생성
  v_request_id := 'refund_' || extract(epoch from now())::bigint || '_' || substring(gen_random_uuid()::text, 1, 8);
  
  -- 새로운 환불 요청 객체 생성
  v_new_request := jsonb_build_object(
    'id', v_request_id,
    'status', CASE 
      WHEN p_requested_by = 'distributor' THEN 'pending_user_confirmation'  -- 총판 요청 시 사용자 확인 대기
      ELSE 'pending'  -- 사용자 요청 시 총판 검토 대기
    END,
    'refund_reason', p_refund_reason,
    'request_date', now()::timestamp,
    'refund_amount', v_refund_amount,
    'requester_id', p_user_id,  -- 실제 요청자 ID
    'requested_by', p_requested_by,  -- 요청자 타입
    'work_period', v_work_period,
    'completed_days', v_completed_days,
    'total_amount', v_total_amount
  );
  
  -- guarantee_slots 테이블의 refund_requests 배열에 추가
  UPDATE guarantee_slots
  SET refund_requests = COALESCE(refund_requests, '[]'::jsonb) || jsonb_build_array(v_new_request)
  WHERE id = p_slot_id;
  
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN p_requested_by = 'distributor' THEN '환불 요청이 사용자에게 전송되었습니다. 사용자 확인 후 처리됩니다.'
      ELSE '환불 신청이 접수되었습니다. 총판 검토 후 처리됩니다.'
    END,
    'request_id', v_request_id,
    'refund_amount', v_refund_amount,
    'work_period', v_work_period,
    'completed_days', v_completed_days,
    'total_amount', v_total_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION add_refund_request IS '보장형 슬롯 환불 요청 추가. p_requested_by가 distributor인 경우 총판이 시작한 환불, user인 경우 사용자가 신청한 환불';