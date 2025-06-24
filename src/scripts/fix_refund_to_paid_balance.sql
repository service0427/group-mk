-- 환불 처리 시 유료 캐시로 들어가도록 수정
-- 작성일: 2025-01-24
-- 문제: 환불 시 무료 캐시로 들어가는 문제 해결

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
      cancellation_reason = '환불 처리 완료',
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
    'refund_amount', CASE WHEN p_action = 'approve' THEN v_refund_amount ELSE 0 END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- guarantee_slots 테이블에 환불 관련 컬럼은 필요 없음 (이미 cancelled 상태 사용)

-- 기존 잘못 처리된 환불 내역 수정 (최근 30일 이내)
-- 주의: 이 쿼리는 한 번만 실행해야 합니다!
/*
UPDATE user_balances ub
SET 
  free_balance = GREATEST(0, free_balance - refund_data.refund_amount),
  paid_balance = paid_balance + refund_data.refund_amount
FROM (
  SELECT 
    uch.user_id,
    SUM(uch.amount) as refund_amount
  FROM user_cash_history uch
  WHERE uch.transaction_type = 'refund'
    AND uch.created_at >= NOW() - INTERVAL '30 days'
    AND uch.balance_type = 'free'  -- 잘못 무료로 들어간 경우
    AND uch.description LIKE '%보장형 슬롯 환불%'
  GROUP BY uch.user_id
) refund_data
WHERE ub.user_id = refund_data.user_id
  AND ub.free_balance >= refund_data.refund_amount;  -- 무료 캐시가 충분한 경우만

-- 해당 캐시 히스토리 balance_type도 수정
UPDATE user_cash_history
SET balance_type = 'paid'
WHERE transaction_type = 'refund'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND balance_type = 'free'
  AND description LIKE '%보장형 슬롯 환불%';
*/