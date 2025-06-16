-- 환불 프로세스 시뮬레이션 함수
-- 실제로 데이터를 변경하지 않고 어떤 변화가 일어날지 미리 보여주는 함수

CREATE OR REPLACE FUNCTION simulate_refund_process()
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  record_id TEXT,
  changes JSONB,
  description TEXT
) AS $$
DECLARE
  v_refund RECORD;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_result_count INTEGER := 0;
BEGIN
  -- 3일 지난 승인된 환불 요청들을 조회
  FOR v_refund IN 
    SELECT 
      sra.id as refund_request_id,
      sra.slot_id,
      COALESCE(sra.approved_amount, sra.refund_amount) as amount,
      sra.approval_date,
      s.mat_id as advertiser_id,
      s.status as slot_status,
      u.full_name as user_name,
      c.campaign_name
    FROM slot_refund_approvals sra
    JOIN slots s ON sra.slot_id = s.id
    JOIN users u ON s.mat_id = u.id
    JOIN campaigns c ON s.product_id = c.id
    WHERE sra.status = 'approved' 
    AND sra.approval_date <= NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM refund_process_logs rpl 
      WHERE rpl.refund_request_id = sra.id 
      AND rpl.status = 'success'
    )
  LOOP
    -- 1. user_balances 변경 예상
    SELECT total_balance INTO v_current_balance
    FROM user_balances 
    WHERE user_id = v_refund.advertiser_id;
    
    v_new_balance := COALESCE(v_current_balance, 0) + v_refund.amount;
    
    RETURN QUERY
    SELECT 
      'user_balances'::TEXT,
      'UPDATE'::TEXT,
      v_refund.advertiser_id::TEXT,
      jsonb_build_object(
        'user_id', v_refund.advertiser_id,
        'current_balance', COALESCE(v_current_balance, 0),
        'new_balance', v_new_balance,
        'change_amount', v_refund.amount
      ),
      format('사용자 %s의 잔액이 %s원에서 %s원으로 증가 (+%s원)',
        v_refund.user_name,
        to_char(COALESCE(v_current_balance, 0), 'FM999,999,999'),
        to_char(v_new_balance, 'FM999,999,999'),
        to_char(v_refund.amount, 'FM999,999,999')
      );

    -- 2. cash_histories 추가 예상
    RETURN QUERY
    SELECT 
      'cash_histories'::TEXT,
      'INSERT'::TEXT,
      gen_random_uuid()::TEXT,
      jsonb_build_object(
        'user_id', v_refund.advertiser_id,
        'amount', v_refund.amount,
        'type', 'refund',
        'description', '슬롯 환불 - 3일 후 자동 처리',
        'balance_after', v_new_balance,
        'reference_id', v_refund.slot_id::TEXT,
        'reference_type', 'slot_refund'
      ),
      format('캐시 히스토리에 환불 기록 추가 (캠페인: %s, 금액: %s원)',
        v_refund.campaign_name,
        to_char(v_refund.amount, 'FM999,999,999')
      );

    -- 3. slot_pending_balances 상태 변경 예상
    RETURN QUERY
    SELECT 
      'slot_pending_balances'::TEXT,
      'UPDATE'::TEXT,
      v_refund.slot_id::TEXT,
      jsonb_build_object(
        'slot_id', v_refund.slot_id,
        'current_status', 'paid',
        'new_status', 'refunded',
        'updated_at', NOW()
      ),
      format('슬롯 %s의 pending balance 상태가 refunded로 변경',
        v_refund.slot_id
      );

    -- 4. slots 상태 변경 예상
    RETURN QUERY
    SELECT 
      'slots'::TEXT,
      'UPDATE'::TEXT,
      v_refund.slot_id::TEXT,
      jsonb_build_object(
        'slot_id', v_refund.slot_id,
        'current_status', v_refund.slot_status,
        'new_status', 'refunded',
        'updated_at', NOW()
      ),
      format('슬롯 상태가 %s에서 refunded로 변경',
        v_refund.slot_status
      );

    -- 5. refund_process_logs 추가 예상
    RETURN QUERY
    SELECT 
      'refund_process_logs'::TEXT,
      'INSERT'::TEXT,
      gen_random_uuid()::TEXT,
      jsonb_build_object(
        'refund_request_id', v_refund.refund_request_id,
        'slot_id', v_refund.slot_id,
        'user_id', v_refund.advertiser_id,
        'amount', v_refund.amount,
        'scheduled_date', v_refund.approval_date + INTERVAL '3 days',
        'status', 'success'
      ),
      '환불 처리 로그에 성공 기록 추가';

    -- 6. notifications 추가 예상
    RETURN QUERY
    SELECT 
      'notifications'::TEXT,
      'INSERT'::TEXT,
      gen_random_uuid()::TEXT,
      jsonb_build_object(
        'user_id', v_refund.advertiser_id,
        'type', 'slot_refund',  -- 올바른 type 값
        'title', '환불 완료',
        'message', format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
          to_char(v_refund.amount, 'FM999,999,999')),
        'priority', 'medium',  -- 올바른 priority 값
        'status', 'unread'  -- 기본 status 값
      ),
      format('사용자 %s에게 환불 완료 알림 전송', v_refund.user_name);

    v_result_count := v_result_count + 1;
  END LOOP;

  -- 처리할 건이 없는 경우
  IF v_result_count = 0 THEN
    RETURN QUERY
    SELECT 
      'NONE'::TEXT,
      'INFO'::TEXT,
      ''::TEXT,
      jsonb_build_object('message', '처리할 환불 건이 없습니다'),
      '3일이 경과한 승인된 환불 요청이 없습니다';
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;



-- 개별 환불 시뮬레이션 함수
CREATE OR REPLACE FUNCTION simulate_single_refund(p_refund_request_id UUID)
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  record_id TEXT,
  changes JSONB,
  description TEXT
) AS $$
DECLARE
  v_refund RECORD;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- 환불 요청 정보 조회
  SELECT 
    sra.id as refund_request_id,
    sra.slot_id,
    COALESCE(sra.approved_amount, sra.refund_amount) as amount,
    sra.approval_date,
    sra.status as approval_status,
    s.mat_id as advertiser_id,
    s.status as slot_status,
    u.full_name as user_name,
    c.campaign_name
  INTO v_refund
  FROM slot_refund_approvals sra
  JOIN slots s ON sra.slot_id = s.id
  JOIN users u ON s.mat_id = u.id
  JOIN campaigns c ON s.product_id = c.id
  WHERE sra.id = p_refund_request_id;

  -- 환불 요청이 없는 경우
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      'NOT_FOUND'::TEXT,
      p_refund_request_id::TEXT,
      jsonb_build_object('error', '환불 요청을 찾을 수 없습니다'),
      '지정된 환불 요청 ID가 존재하지 않습니다';
    RETURN;
  END IF;

  -- 이미 처리된 환불인 경우
  IF EXISTS (
    SELECT 1 FROM refund_process_logs 
    WHERE refund_request_id = p_refund_request_id 
    AND status = 'success'
  ) THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      'ALREADY_PROCESSED'::TEXT,
      p_refund_request_id::TEXT,
      jsonb_build_object('error', '이미 처리된 환불입니다'),
      '이 환불 요청은 이미 성공적으로 처리되었습니다';
    RETURN;
  END IF;

  -- 승인되지 않은 환불인 경우
  IF v_refund.approval_status != 'approved' THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      'NOT_APPROVED'::TEXT,
      p_refund_request_id::TEXT,
      jsonb_build_object(
        'error', '승인되지 않은 환불입니다',
        'current_status', v_refund.approval_status
      ),
      format('환불 상태가 %s입니다. approved 상태만 처리 가능합니다', v_refund.approval_status);
    RETURN;
  END IF;

  -- 1. user_balances 변경 예상
  SELECT total_balance INTO v_current_balance
  FROM user_balances 
  WHERE user_id = v_refund.advertiser_id;
  
  v_new_balance := COALESCE(v_current_balance, 0) + v_refund.amount;
  
  RETURN QUERY
  SELECT 
    'user_balances'::TEXT,
    'UPDATE'::TEXT,
    v_refund.advertiser_id::TEXT,
    jsonb_build_object(
      'user_id', v_refund.advertiser_id,
      'current_balance', COALESCE(v_current_balance, 0),
      'new_balance', v_new_balance,
      'change_amount', v_refund.amount
    ),
    format('사용자 %s의 잔액이 %s원에서 %s원으로 증가 (+%s원)',
      v_refund.user_name,
      to_char(COALESCE(v_current_balance, 0), 'FM999,999,999'),
      to_char(v_new_balance, 'FM999,999,999'),
      to_char(v_refund.amount, 'FM999,999,999')
    );

  -- 2. cash_histories 추가 예상
  RETURN QUERY
  SELECT 
    'cash_histories'::TEXT,
    'INSERT'::TEXT,
    gen_random_uuid()::TEXT,
    jsonb_build_object(
      'user_id', v_refund.advertiser_id,
      'amount', v_refund.amount,
      'type', 'refund',
      'description', '슬롯 환불 - 즉시 처리',
      'balance_after', v_new_balance,
      'reference_id', v_refund.slot_id::TEXT,
      'reference_type', 'slot_refund'
    ),
    format('캐시 히스토리에 환불 기록 추가 (캠페인: %s, 금액: %s원)',
      v_refund.campaign_name,
      to_char(v_refund.amount, 'FM999,999,999')
    );

  -- 3. slot_pending_balances 상태 변경 예상
  RETURN QUERY
  SELECT 
    'slot_pending_balances'::TEXT,
    'UPDATE'::TEXT,
    v_refund.slot_id::TEXT,
    jsonb_build_object(
      'slot_id', v_refund.slot_id,
      'current_status', 'paid',
      'new_status', 'refunded',
      'updated_at', NOW()
    ),
    format('슬롯 %s의 pending balance 상태가 refunded로 변경',
      v_refund.slot_id
    );

  -- 4. slots 상태 변경 예상
  RETURN QUERY
  SELECT 
    'slots'::TEXT,
    'UPDATE'::TEXT,
    v_refund.slot_id::TEXT,
    jsonb_build_object(
      'slot_id', v_refund.slot_id,
      'current_status', v_refund.slot_status,
      'new_status', 'refunded',
      'updated_at', NOW()
    ),
    format('슬롯 상태가 %s에서 refunded로 변경',
      v_refund.slot_status
    );

  -- 5. refund_process_logs 추가 예상
  RETURN QUERY
  SELECT 
    'refund_process_logs'::TEXT,
    'INSERT'::TEXT,
    gen_random_uuid()::TEXT,
    jsonb_build_object(
      'refund_request_id', v_refund.refund_request_id,
      'slot_id', v_refund.slot_id,
      'user_id', v_refund.advertiser_id,
      'amount', v_refund.amount,
      'scheduled_date', NOW(),
      'status', 'success'
    ),
    '환불 처리 로그에 성공 기록 추가 (즉시 처리)';

  -- 6. notifications 추가 예상
  RETURN QUERY
  SELECT 
    'notifications'::TEXT,
    'INSERT'::TEXT,
    gen_random_uuid()::TEXT,
    jsonb_build_object(
      'user_id', v_refund.advertiser_id,
      'type', 'refund_completed',
      'title', '환불 완료',
      'message', format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
        to_char(v_refund.amount, 'FM999,999,999')),
      'reference_id', v_refund.slot_id::TEXT,
      'reference_type', 'slot'
    ),
    format('사용자 %s에게 환불 완료 알림 전송', v_refund.user_name);

  RETURN;
END;
$$ LANGUAGE plpgsql;


-- =================== 최종 수정
-- 시뮬레이션 함수도 올바른 테이블 구조로 수정
-- cash_histories -> user_cash_history
-- notifications 테이블 컬럼 수정

-- 환불 프로세스 시뮬레이션 함수 수정
CREATE OR REPLACE FUNCTION simulate_refund_process()
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  record_id TEXT,
  changes JSONB,
  description TEXT
) AS $$
DECLARE
  v_refund RECORD;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_result_count INTEGER := 0;
BEGIN
  -- 3일 지난 승인된 환불 요청들을 조회
  FOR v_refund IN 
    SELECT 
      sra.id as refund_request_id,
      sra.slot_id,
      COALESCE(sra.approved_amount, sra.refund_amount) as amount,
      sra.approval_date,
      s.mat_id as advertiser_id,
      s.status as slot_status,
      u.full_name as user_name,
      c.campaign_name
    FROM slot_refund_approvals sra
    JOIN slots s ON sra.slot_id = s.id
    JOIN users u ON s.mat_id = u.id
    JOIN campaigns c ON s.product_id = c.id
    WHERE sra.status = 'approved' 
    AND sra.approval_date <= NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM refund_process_logs rpl 
      WHERE rpl.refund_request_id = sra.id 
      AND rpl.status = 'success'
    )
  LOOP
    -- 1. user_balances 변경 예상
    SELECT total_balance INTO v_current_balance
    FROM user_balances 
    WHERE user_id = v_refund.advertiser_id;
    
    v_new_balance := COALESCE(v_current_balance, 0) + v_refund.amount;
    
    RETURN QUERY
    SELECT 
      'user_balances'::TEXT,
      'UPDATE'::TEXT,
      v_refund.advertiser_id::TEXT,
      jsonb_build_object(
        'user_id', v_refund.advertiser_id,
        'current_balance', COALESCE(v_current_balance, 0),
        'new_balance', v_new_balance,
        'change_amount', v_refund.amount
      ),
      format('사용자 %s의 잔액이 %s원에서 %s원으로 증가 (+%s원)',
        v_refund.user_name,
        to_char(COALESCE(v_current_balance, 0), 'FM999,999,999'),
        to_char(v_new_balance, 'FM999,999,999'),
        to_char(v_refund.amount, 'FM999,999,999')
      );

    -- 2. user_cash_history 추가 예상 (올바른 테이블명)
    RETURN QUERY
    SELECT 
      'user_cash_history'::TEXT,
      'INSERT'::TEXT,
      gen_random_uuid()::TEXT,
      jsonb_build_object(
        'user_id', v_refund.advertiser_id,
        'amount', v_refund.amount::INTEGER,
        'transaction_type', 'refund',
        'description', '슬롯 환불 - 3일 후 자동 처리',
        'reference_id', v_refund.slot_id,
        'transaction_at', NOW()
      ),
      format('캐시 히스토리에 환불 기록 추가 (캠페인: %s, 금액: %s원)',
        v_refund.campaign_name,
        to_char(v_refund.amount, 'FM999,999,999')
      );

    -- 3. slot_pending_balances 상태 변경 예상 (updated_at -> processed_at)
    RETURN QUERY
    SELECT 
      'slot_pending_balances'::TEXT,
      'UPDATE'::TEXT,
      v_refund.slot_id::TEXT,
      jsonb_build_object(
        'slot_id', v_refund.slot_id,
        'current_status', 'paid',
        'new_status', 'refunded',
        'processed_at', NOW()
      ),
      format('슬롯 %s의 pending balance 상태가 refunded로 변경',
        v_refund.slot_id
      );

    -- 4. slots 상태 변경 예상
    RETURN QUERY
    SELECT 
      'slots'::TEXT,
      'UPDATE'::TEXT,
      v_refund.slot_id::TEXT,
      jsonb_build_object(
        'slot_id', v_refund.slot_id,
        'current_status', v_refund.slot_status,
        'new_status', 'refunded',
        'updated_at', NOW()
      ),
      format('슬롯 상태가 %s에서 refunded로 변경',
        v_refund.slot_status
      );

    -- 5. refund_process_logs 추가 예상
    RETURN QUERY
    SELECT 
      'refund_process_logs'::TEXT,
      'INSERT'::TEXT,
      gen_random_uuid()::TEXT,
      jsonb_build_object(
        'refund_request_id', v_refund.refund_request_id,
        'slot_id', v_refund.slot_id,
        'user_id', v_refund.advertiser_id,
        'amount', v_refund.amount,
        'scheduled_date', v_refund.approval_date + INTERVAL '3 days',
        'status', 'success'
      ),
      '환불 처리 로그에 성공 기록 추가';

    -- 6. notifications 추가 예상 (올바른 컬럼 구조)
    RETURN QUERY
    SELECT 
      'notifications'::TEXT,
      'INSERT'::TEXT,
      gen_random_uuid()::TEXT,
      jsonb_build_object(
        'user_id', v_refund.advertiser_id,
        'type', 'slot_refund',  -- 올바른 type 값
        'title', '환불 완료',
        'message', format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
          to_char(v_refund.amount, 'FM999,999,999')),
        'priority', 'medium',  -- 올바른 priority 값
        'status', 'unread'  -- 기본 status 값
      ),
      format('사용자 %s에게 환불 완료 알림 전송', v_refund.user_name);

    v_result_count := v_result_count + 1;
  END LOOP;

  -- 처리할 건이 없는 경우
  IF v_result_count = 0 THEN
    RETURN QUERY
    SELECT 
      'NONE'::TEXT,
      'INFO'::TEXT,
      ''::TEXT,
      jsonb_build_object('message', '처리할 환불 건이 없습니다'),
      '3일이 경과한 승인된 환불 요청이 없습니다';
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 개별 환불 시뮬레이션 함수 수정
CREATE OR REPLACE FUNCTION simulate_single_refund(p_refund_request_id UUID)
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  record_id TEXT,
  changes JSONB,
  description TEXT
) AS $$
DECLARE
  v_refund RECORD;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- 환불 요청 정보 조회
  SELECT 
    sra.id as refund_request_id,
    sra.slot_id,
    COALESCE(sra.approved_amount, sra.refund_amount) as amount,
    sra.approval_date,
    sra.status as approval_status,
    s.mat_id as advertiser_id,
    s.status as slot_status,
    u.full_name as user_name,
    c.campaign_name
  INTO v_refund
  FROM slot_refund_approvals sra
  JOIN slots s ON sra.slot_id = s.id
  JOIN users u ON s.mat_id = u.id
  JOIN campaigns c ON s.product_id = c.id
  WHERE sra.id = p_refund_request_id;

  -- 환불 요청이 없는 경우
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      'NOT_FOUND'::TEXT,
      p_refund_request_id::TEXT,
      jsonb_build_object('error', '환불 요청을 찾을 수 없습니다'),
      '지정된 환불 요청 ID가 존재하지 않습니다';
    RETURN;
  END IF;

  -- 이미 처리된 환불인 경우
  IF EXISTS (
    SELECT 1 FROM refund_process_logs 
    WHERE refund_request_id = p_refund_request_id 
    AND status = 'success'
  ) THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      'ALREADY_PROCESSED'::TEXT,
      p_refund_request_id::TEXT,
      jsonb_build_object('error', '이미 처리된 환불입니다'),
      '이 환불 요청은 이미 성공적으로 처리되었습니다';
    RETURN;
  END IF;

  -- 승인되지 않은 환불인 경우
  IF v_refund.approval_status != 'approved' THEN
    RETURN QUERY
    SELECT 
      'ERROR'::TEXT,
      'NOT_APPROVED'::TEXT,
      p_refund_request_id::TEXT,
      jsonb_build_object(
        'error', '승인되지 않은 환불입니다',
        'current_status', v_refund.approval_status
      ),
      format('환불 상태가 %s입니다. approved 상태만 처리 가능합니다', v_refund.approval_status);
    RETURN;
  END IF;

  -- 1. user_balances 변경 예상
  SELECT total_balance INTO v_current_balance
  FROM user_balances 
  WHERE user_id = v_refund.advertiser_id;
  
  v_new_balance := COALESCE(v_current_balance, 0) + v_refund.amount;
  
  RETURN QUERY
  SELECT 
    'user_balances'::TEXT,
    'UPDATE'::TEXT,
    v_refund.advertiser_id::TEXT,
    jsonb_build_object(
      'user_id', v_refund.advertiser_id,
      'current_balance', COALESCE(v_current_balance, 0),
      'new_balance', v_new_balance,
      'change_amount', v_refund.amount
    ),
    format('사용자 %s의 잔액이 %s원에서 %s원으로 증가 (+%s원)',
      v_refund.user_name,
      to_char(COALESCE(v_current_balance, 0), 'FM999,999,999'),
      to_char(v_new_balance, 'FM999,999,999'),
      to_char(v_refund.amount, 'FM999,999,999')
    );

  -- 2. user_cash_history 추가 예상 (올바른 테이블명)
  RETURN QUERY
  SELECT 
    'user_cash_history'::TEXT,
    'INSERT'::TEXT,
    gen_random_uuid()::TEXT,
    jsonb_build_object(
      'user_id', v_refund.advertiser_id,
      'amount', v_refund.amount::INTEGER,
      'transaction_type', 'refund',
      'description', '슬롯 환불 - 즉시 처리',
      'reference_id', v_refund.slot_id,
      'transaction_at', NOW()
    ),
    format('캐시 히스토리에 환불 기록 추가 (캠페인: %s, 금액: %s원)',
      v_refund.campaign_name,
      to_char(v_refund.amount, 'FM999,999,999')
    );

  -- 3. slot_pending_balances 상태 변경 예상 (updated_at -> processed_at)
  RETURN QUERY
  SELECT 
    'slot_pending_balances'::TEXT,
    'UPDATE'::TEXT,
    v_refund.slot_id::TEXT,
    jsonb_build_object(
      'slot_id', v_refund.slot_id,
      'current_status', 'paid',
      'new_status', 'refunded',
      'processed_at', NOW()
    ),
    format('슬롯 %s의 pending balance 상태가 refunded로 변경',
      v_refund.slot_id
    );

  -- 4. slots 상태 변경 예상
  RETURN QUERY
  SELECT 
    'slots'::TEXT,
    'UPDATE'::TEXT,
    v_refund.slot_id::TEXT,
    jsonb_build_object(
      'slot_id', v_refund.slot_id,
      'current_status', v_refund.slot_status,
      'new_status', 'refunded',
      'updated_at', NOW()
    ),
    format('슬롯 상태가 %s에서 refunded로 변경',
      v_refund.slot_status
    );

  -- 5. refund_process_logs 추가 예상
  RETURN QUERY
  SELECT 
    'refund_process_logs'::TEXT,
    'INSERT'::TEXT,
    gen_random_uuid()::TEXT,
    jsonb_build_object(
      'refund_request_id', v_refund.refund_request_id,
      'slot_id', v_refund.slot_id,
      'user_id', v_refund.advertiser_id,
      'amount', v_refund.amount,
      'scheduled_date', NOW(),
      'status', 'success'
    ),
    '환불 처리 로그에 성공 기록 추가 (즉시 처리)';

  -- 6. notifications 추가 예상 (올바른 컬럼 구조)
  RETURN QUERY
  SELECT 
    'notifications'::TEXT,
    'INSERT'::TEXT,
    gen_random_uuid()::TEXT,
    jsonb_build_object(
      'user_id', v_refund.advertiser_id,
      'type', 'refund_completed',
      'title', '환불 완료',
      'message', format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
        to_char(v_refund.amount, 'FM999,999,999')),
      'priority', 'medium',
      'status', 'unread'
    ),
    format('사용자 %s에게 환불 완료 알림 전송', v_refund.user_name);

  RETURN;
END;
$$ LANGUAGE plpgsql;