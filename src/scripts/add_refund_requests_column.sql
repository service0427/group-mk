-- 보장형 슬롯 환불 요청 스키마 추가
-- 작성일: 2025-06-20
-- 설명: guarantee_slots 테이블에 refund_requests JSONB 컬럼 추가

-- 1. guarantee_slots 테이블에 refund_requests 컬럼 추가
ALTER TABLE guarantee_slots 
ADD COLUMN IF NOT EXISTS refund_requests JSONB DEFAULT '[]'::jsonb;

-- 2. refund_requests 컬럼에 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_refund_requests 
ON guarantee_slots USING gin (refund_requests);

-- 3. 환불 요청 상태 확인을 위한 함수 생성
CREATE OR REPLACE FUNCTION has_pending_refund_request(slot_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO pending_count
  FROM guarantee_slots gs,
       jsonb_array_elements(gs.refund_requests) AS refund_req
  WHERE gs.id = slot_id
    AND refund_req->>'status' = 'pending';
    
  RETURN pending_count > 0;
END;
$$;

-- 4. 환불 요청 추가 함수 생성
CREATE OR REPLACE FUNCTION add_refund_request(
  p_slot_id UUID,
  p_user_id UUID,
  p_refund_reason TEXT,
  p_refund_amount NUMERIC(10,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_request JSONB;
  v_request_id TEXT;
BEGIN
  -- 이미 대기 중인 환불 요청이 있는지 확인
  IF has_pending_refund_request(p_slot_id) THEN
    RAISE EXCEPTION '이미 처리 중인 환불 요청이 있습니다.';
  END IF;
  
  -- 환불 요청 ID 생성
  v_request_id := 'refund_' || extract(epoch from now())::bigint || '_' || substring(gen_random_uuid()::text, 1, 8);
  
  -- 새로운 환불 요청 객체 생성
  v_new_request := jsonb_build_object(
    'id', v_request_id,
    'status', 'pending',
    'refund_reason', p_refund_reason,
    'request_date', now()::timestamp,
    'refund_amount', p_refund_amount,
    'requester_id', p_user_id
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
    'refund_amount', p_refund_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 5. 환불 요청 승인/거절 함수 생성
CREATE OR REPLACE FUNCTION process_refund_request(
  p_slot_id UUID,
  p_request_id TEXT,
  p_distributor_id UUID,
  p_action TEXT, -- 'approve' 또는 'reject'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot guarantee_slots;
  v_refund_requests JSONB;
  v_updated_requests JSONB;
  v_request_found BOOLEAN := FALSE;
  v_refund_amount NUMERIC(10,2);
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
  
  -- 환불 요청들 조회
  v_refund_requests := COALESCE(v_slot.refund_requests, '[]'::jsonb);
  v_updated_requests := '[]'::jsonb;
  
  -- 각 환불 요청을 확인하고 업데이트
  FOR i IN 0..jsonb_array_length(v_refund_requests) - 1 LOOP
    DECLARE
      v_request JSONB := v_refund_requests->i;
    BEGIN
      IF v_request->>'id' = p_request_id AND v_request->>'status' = 'pending' THEN
        v_request_found := TRUE;
        v_refund_amount := (v_request->>'refund_amount')::NUMERIC(10,2);
        
        -- 요청 상태 업데이트
        v_request := v_request || jsonb_build_object(
          'status', p_action || 'd', -- 'approved' 또는 'rejected'
          'approval_date', now()::timestamp,
          'approver_id', p_distributor_id,
          'approval_notes', p_notes
        );
      END IF;
      
      v_updated_requests := v_updated_requests || jsonb_build_array(v_request);
    END;
  END LOOP;
  
  IF NOT v_request_found THEN
    RAISE EXCEPTION '해당 환불 요청을 찾을 수 없거나 이미 처리되었습니다.';
  END IF;
  
  -- 업데이트된 환불 요청들을 저장
  UPDATE guarantee_slots
  SET refund_requests = v_updated_requests
  WHERE id = p_slot_id;
  
  -- 승인인 경우 실제 환불 처리
  IF p_action = 'approve' THEN
    -- 사용자 잔액에 환불 금액 추가
    UPDATE user_balances
    SET 
      free_balance = free_balance + v_refund_amount,
      total_balance = total_balance + v_refund_amount
    WHERE user_id = v_slot.user_id;
    
    -- 슬롯 상태를 취소로 변경
    UPDATE guarantee_slots
    SET 
      status = 'cancelled',
      cancellation_reason = '사용자 환불 요청 승인'
    WHERE id = p_slot_id;
    
    -- 거래 내역 추가
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
      '환불 승인 - ' || COALESCE(p_notes, '사용자 요청')
    );
    
    -- 사용자 캐시 히스토리 추가
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
      'free'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN p_action = 'approve' THEN '환불이 승인되어 처리되었습니다.'
      ELSE '환불 요청이 거절되었습니다.'
    END,
    'action', p_action,
    'refund_amount', CASE WHEN p_action = 'approve' THEN v_refund_amount ELSE 0 END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 6. 함수 권한 설정
GRANT EXECUTE ON FUNCTION has_pending_refund_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_refund_request(UUID, UUID, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION process_refund_request(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;

-- 7. 기존 데이터에 빈 refund_requests 배열 설정 (NULL인 경우)
UPDATE guarantee_slots 
SET refund_requests = '[]'::jsonb 
WHERE refund_requests IS NULL;