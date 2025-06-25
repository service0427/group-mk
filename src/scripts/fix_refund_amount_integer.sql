-- 환불 금액을 정수로 처리하도록 수정
CREATE OR REPLACE FUNCTION add_refund_request(
  p_slot_id UUID,
  p_user_id UUID,
  p_refund_reason TEXT,
  p_refund_amount NUMERIC(10,2),
  p_requested_by TEXT DEFAULT 'user'
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
  v_work_period INTEGER;
  v_completed_days INTEGER;
  v_total_amount NUMERIC;
  v_completed_amount NUMERIC;
  v_refund_amount NUMERIC;
BEGIN
  -- 슬롯 정보 조회
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
    AND status IN ('active', 'completed');

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', '유효하지 않은 슬롯이거나 환불 가능한 상태가 아닙니다.'
    );
  END IF;

  -- 권한 확인: 사용자나 총판만 환불 요청 가능
  IF p_requested_by = 'user' THEN
    -- 사용자 요청: guarantee_slot_requests의 user_id 확인
    IF NOT EXISTS (
      SELECT 1 FROM guarantee_slot_requests 
      WHERE id = v_slot.request_id AND user_id = p_user_id
    ) THEN
      RETURN json_build_object(
        'success', false,
        'message', '슬롯에 대한 권한이 없습니다.'
      );
    END IF;
  ELSIF p_requested_by = 'distributor' THEN
    -- 총판 요청: distributor_id 확인
    IF v_slot.distributor_id != p_user_id THEN
      RETURN json_build_object(
        'success', false,
        'message', '슬롯에 대한 권한이 없습니다.'
      );
    END IF;
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', '잘못된 요청자 타입입니다.'
    );
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

  -- 환불 금액 계산 (VAT 포함) - 정수로 처리
  v_total_amount := FLOOR(v_request.final_daily_amount * v_work_period * 1.1);
  v_completed_amount := FLOOR(v_request.final_daily_amount * v_completed_days * 1.1);
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
      WHEN p_requested_by = 'distributor' THEN 'pending_user_confirmation'
      ELSE 'pending'
    END,
    'refund_reason', p_refund_reason,
    'request_date', now()::timestamp,
    'refund_amount', v_refund_amount,
    'requester_id', p_user_id,
    'requested_by', p_requested_by,
    'work_period', v_work_period,
    'completed_days', v_completed_days,
    'total_amount', v_total_amount
  );
  
  -- 기존 refund_requests 배열에 추가
  UPDATE guarantee_slots
  SET refund_requests = COALESCE(refund_requests, '[]'::jsonb) || v_new_request
  WHERE id = p_slot_id;
  
  -- 성공 응답
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN p_requested_by = 'distributor' THEN '환불 요청이 사용자에게 전송되었습니다.'
      ELSE '환불 요청이 접수되었습니다.'
    END,
    'request_id', v_request_id,
    'refund_amount', v_refund_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', '환불 요청 처리 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$$;

-- 기존 소수점 데이터 정리
UPDATE guarantee_slots
SET refund_requests = (
  SELECT jsonb_agg(
    CASE 
      WHEN (request->>'refund_amount')::numeric % 1 != 0 
      THEN request || jsonb_build_object('refund_amount', FLOOR((request->>'refund_amount')::numeric))
      ELSE request
    END
  )
  FROM jsonb_array_elements(refund_requests) AS request
)
WHERE refund_requests IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(refund_requests) AS request
    WHERE (request->>'refund_amount')::numeric % 1 != 0
  );