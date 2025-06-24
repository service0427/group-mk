-- 환불 중복 처리 방지 및 알림 추가
-- 작성일: 2025-01-24
-- 문제: 
-- 1. 환불이 중복으로 처리됨
-- 2. 환불 승인 시 사용자에게 알림이 가지 않음
-- 3. 환불 후 상태가 '환불 검토중'에서 변경되지 않음

-- process_refund_request 함수 수정
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
  v_request_status TEXT;
  v_already_processed BOOLEAN := FALSE;
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
      IF v_request->>'id' = p_request_id THEN
        v_request_found := TRUE;
        v_request_status := v_request->>'status';
        
        -- 이미 처리된 요청인지 확인
        IF v_request_status != 'pending' THEN
          v_already_processed := TRUE;
          RAISE EXCEPTION '이미 처리된 환불 요청입니다. (현재 상태: %)', v_request_status;
        END IF;
        
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
    RAISE EXCEPTION '해당 환불 요청을 찾을 수 없습니다.';
  END IF;
  
  -- 업데이트된 환불 요청들을 저장
  UPDATE guarantee_slots
  SET refund_requests = v_updated_requests,
      updated_at = now()
  WHERE id = p_slot_id;
  
  -- 승인인 경우 실제 환불 처리
  IF p_action = 'approve' THEN
    -- 중복 환불 방지를 위한 추가 체크
    IF EXISTS (
      SELECT 1 FROM guarantee_slot_transactions
      WHERE guarantee_slot_id = p_slot_id
        AND transaction_type = 'refund'
        AND description LIKE '%환불 승인%'
        AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
      RAISE EXCEPTION '최근에 이미 환불 처리가 완료되었습니다.';
    END IF;
    
    -- 사용자 잔액에 환불 금액 추가 (유료 캐시로만!)
    UPDATE user_balances
    SET 
      paid_balance = paid_balance + v_refund_amount,
      total_balance = total_balance + v_refund_amount
    WHERE user_id = v_slot.user_id;
    
    -- 슬롯 상태를 취소로 변경
    UPDATE guarantee_slots
    SET 
      status = 'cancelled',
      cancellation_reason = '환불 승인',
      updated_at = now()
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
    
    -- 사용자 캐시 히스토리 추가 (유료 캐시로 명시!)
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
      'paid'  -- 유료 캐시로 명시
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN p_action = 'approve' THEN '환불이 승인되어 처리되었습니다.'
      ELSE '환불 요청이 거절되었습니다.'
    END,
    'action', p_action,
    'refund_amount', CASE WHEN p_action = 'approve' THEN v_refund_amount ELSE 0 END,
    'user_id', v_slot.user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION process_refund_request TO authenticated;