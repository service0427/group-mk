-- 기존 환불 요청들의 금액을 보장 일수 기준으로 재계산
DO $$
DECLARE
  v_slot RECORD;
  v_request RECORD;
  v_refund_request JSONB;
  v_new_refund_requests JSONB;
  v_total_amount NUMERIC;
  v_completed_amount NUMERIC;
  v_refund_amount NUMERIC;
  v_completed_days INTEGER;
  v_index INTEGER;
BEGIN
  -- 환불 요청이 있는 모든 슬롯을 순회
  FOR v_slot IN 
    SELECT gs.*, gsr.final_daily_amount, gsr.guarantee_count
    FROM guarantee_slots gs
    JOIN guarantee_slot_requests gsr ON gs.request_id = gsr.id
    WHERE gs.refund_requests IS NOT NULL 
      AND jsonb_array_length(gs.refund_requests) > 0
  LOOP
    v_new_refund_requests := '[]'::jsonb;
    v_index := 0;
    
    -- 각 환불 요청을 순회하며 금액 재계산
    FOR v_refund_request IN SELECT * FROM jsonb_array_elements(v_slot.refund_requests)
    LOOP
      -- 환불 요청의 상태가 pending, pending_user_confirmation, approved인 경우만 재계산
      IF v_refund_request->>'status' IN ('pending', 'pending_user_confirmation', 'approved') THEN
        -- 완료된 일수 계산
        IF v_slot.start_date IS NOT NULL AND v_slot.start_date <= CURRENT_DATE THEN
          v_completed_days := LEAST(
            (CURRENT_DATE - v_slot.start_date::date),
            v_slot.guarantee_count
          );
        ELSE
          v_completed_days := 0;
        END IF;
        
        -- 환불 금액 재계산 (보장 일수 기준)
        v_total_amount := FLOOR(v_slot.final_daily_amount * v_slot.guarantee_count * 1.1);
        v_completed_amount := FLOOR(v_slot.final_daily_amount * v_completed_days * 1.1);
        v_refund_amount := GREATEST(0, v_total_amount - v_completed_amount);
        
        -- 미래 시작인 경우 전액 환불
        IF v_slot.start_date IS NOT NULL AND v_slot.start_date > CURRENT_DATE THEN
          v_refund_amount := v_total_amount;
        END IF;
        
        -- 환불 요청 업데이트
        v_refund_request := v_refund_request || 
          jsonb_build_object(
            'refund_amount', v_refund_amount,
            'total_amount', v_total_amount,
            'completed_days', v_completed_days,
            'guarantee_count', v_slot.guarantee_count,
            'recalculated_at', now()
          );
      END IF;
      
      v_new_refund_requests := v_new_refund_requests || v_refund_request;
      v_index := v_index + 1;
    END LOOP;
    
    -- 슬롯의 환불 요청 업데이트
    UPDATE guarantee_slots
    SET refund_requests = v_new_refund_requests
    WHERE id = v_slot.id;
    
    RAISE NOTICE '슬롯 % 의 환불 요청 금액이 재계산되었습니다.', v_slot.id;
  END LOOP;
END;
$$;

-- 재계산 결과 확인
SELECT 
  gs.id as slot_id,
  gsr.guarantee_count,
  gsr.guarantee_period,
  gsr.final_daily_amount,
  jsonb_array_length(gs.refund_requests) as refund_count,
  gs.refund_requests
FROM guarantee_slots gs
JOIN guarantee_slot_requests gsr ON gs.request_id = gsr.id
WHERE gs.refund_requests IS NOT NULL 
  AND jsonb_array_length(gs.refund_requests) > 0
ORDER BY gs.created_at DESC;