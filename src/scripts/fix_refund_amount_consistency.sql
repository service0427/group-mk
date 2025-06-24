-- 환불 금액 계산 일관성 문제 해결
-- 작성일: 2025-06-24
-- 문제: 프론트엔드와 백엔드의 환불 금액 계산이 다름
-- 해결: 모든 환불 계산을 작업기간(guarantee_period) × 일일금액 × 1.1(VAT) 기준으로 통일

-- 1. refund_guarantee_slot 함수 수정 (총판이 직접 환불할 때)
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
  v_total_amount NUMERIC(10,2);
  v_completed_amount NUMERIC(10,2);
  v_refund_amount NUMERIC(10,2);
  v_work_period INTEGER;
  v_request guarantee_slot_requests;
  v_completed_days INTEGER;
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

  -- 원래 견적 요청 정보에서 작업기간과 일일금액 가져오기
  SELECT * INTO v_request
  FROM guarantee_slot_requests
  WHERE id = v_slot.request_id;

  -- 작업기간 결정 (guarantee_period가 있으면 사용, 없으면 guarantee_count 사용)
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

  -- 환불 금액 계산 (VAT 포함)
  -- 전체 금액 = 일일금액 × 작업기간 × 1.1
  v_total_amount := v_request.final_daily_amount * v_work_period * 1.1;
  -- 완료된 금액 = 일일금액 × 완료일수 × 1.1
  v_completed_amount := v_request.final_daily_amount * v_completed_days * 1.1;
  -- 환불 금액 = 전체 금액 - 완료된 금액
  v_refund_amount := GREATEST(0, v_total_amount - v_completed_amount);

  -- 미래 시작인 경우 전액 환불
  IF v_slot.start_date IS NOT NULL AND v_slot.start_date > CURRENT_DATE THEN
    v_refund_amount := v_total_amount;
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

  RETURN json_build_object(
    'success', true,
    'message', '환불이 처리되었습니다.',
    'refund_amount', v_refund_amount,
    'work_period', v_work_period,
    'guarantee_count', v_slot.guarantee_count,
    'completed_days', v_completed_days,
    'total_amount', v_total_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 2. add_refund_request 함수도 동일한 방식으로 수정
CREATE OR REPLACE FUNCTION add_refund_request(
  p_slot_id UUID,
  p_user_id UUID,
  p_refund_reason TEXT,
  p_refund_amount NUMERIC(10,2)  -- 프론트엔드에서 계산된 금액 (무시됨)
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
BEGIN
  -- 슬롯 정보 조회
  SELECT * INTO v_slot
  FROM guarantee_slots
  WHERE id = p_slot_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
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
  
  -- 새로운 환불 요청 객체 생성 (계산된 환불 금액 사용)
  v_new_request := jsonb_build_object(
    'id', v_request_id,
    'status', 'pending',
    'refund_reason', p_refund_reason,
    'request_date', now()::timestamp,
    'refund_amount', v_refund_amount,  -- 백엔드에서 계산된 금액
    'requester_id', p_user_id,
    'work_period', v_work_period,
    'completed_days', v_completed_days,
    'total_amount', v_total_amount
  );
  
  -- guarantee_slots 테이블의 refund_requests 배열에 추가
  UPDATE guarantee_slots
  SET refund_requests = COALESCE(refund_requests, '[]'::jsonb) || jsonb_build_array(v_new_request)
  WHERE id = p_slot_id
    AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다.';
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', '환불 신청이 접수되었습니다. 총판 검토 후 처리됩니다.',
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