-- 캠페인의 환불 설정을 동적으로 읽어서 처리하는 스케줄 함수
-- 기존 테이블 수정 없이 캠페인별 환불 정책에 따라 처리
-- 모든 테이블명과 컬럼명을 supabase-table.sql 기준으로 수정

-- 동적 환불 스케줄 처리 함수 (기존 process_scheduled_refunds를 대체)
CREATE OR REPLACE FUNCTION process_scheduled_refunds()
RETURNS TABLE (
  processed_count INTEGER,
  success_count INTEGER,
  failed_count INTEGER,
  total_refund_amount DECIMAL
) AS $$
DECLARE
  refund RECORD;
  v_processed_count INTEGER := 0;
  v_success_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_total_amount DECIMAL := 0;
  v_balance_after RECORD;
  v_refund_settings JSONB;
  v_delay_days INTEGER;
  v_scheduled_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 승인된 환불 요청들을 캠페인 설정과 함께 조회
  FOR refund IN 
    SELECT 
      sra.id as refund_request_id,
      sra.slot_id,
      COALESCE(sra.approved_amount, sra.refund_amount) as amount,
      sra.approval_date,
      s.user_id as advertiser_id,  -- user_id가 광고주 ID (mat_id는 총판 ID)
      c.refund_settings,
      c.campaign_name
    FROM slot_refund_approvals sra
    JOIN slots s ON sra.slot_id = s.id
    JOIN campaigns c ON s.product_id = c.id
    WHERE sra.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM refund_process_logs rpl 
      WHERE rpl.refund_request_id = sra.id 
      AND rpl.status = 'success'
    )
    FOR UPDATE
  LOOP
    -- 캠페인의 환불 설정 확인
    v_refund_settings := refund.refund_settings;
    
    -- 환불 지연 일수 계산
    IF v_refund_settings IS NULL THEN
      -- 기본값: 3일
      v_delay_days := 3;
    ELSIF v_refund_settings->>'type' = 'immediate' THEN
      -- 즉시 환불: 0일
      v_delay_days := 0;
    ELSIF v_refund_settings->>'type' = 'delayed' THEN
      -- 지연 환불: delay_days 사용
      v_delay_days := COALESCE((v_refund_settings->>'delay_days')::INTEGER, 3);
    ELSE
      -- 기타: 기본 3일
      v_delay_days := 3;
    END IF;
    
    -- 예정 환불 날짜 계산
    v_scheduled_date := refund.approval_date + (v_delay_days || ' days')::INTERVAL;
    
    -- 예정 날짜가 지났는지 확인
    IF v_scheduled_date > NOW() THEN
      CONTINUE; -- 아직 처리 시간이 되지 않음
    END IF;
    
    v_processed_count := v_processed_count + 1;
    
    BEGIN
      -- 트랜잭션 시작

      -- user_balances 업데이트 (광고주에게 환불) - 무조건 유료 캐시로
      UPDATE user_balances 
      SET paid_balance = paid_balance + refund.amount,
          total_balance = total_balance + refund.amount,
          updated_at = NOW()
      WHERE user_id = refund.advertiser_id
      RETURNING paid_balance, free_balance, total_balance INTO v_balance_after;

      -- user_cash_history 기록 (올바른 테이블명과 컬럼 사용)
      INSERT INTO user_cash_history (
        user_id, 
        amount, 
        transaction_type, 
        description, 
        reference_id,
        transaction_at,
        balance_type  -- 무조건 유료 캐시로 환불
      ) VALUES (
        refund.advertiser_id,
        refund.amount::INTEGER,  -- amount는 INTEGER 타입
        'refund',  -- transaction_type
        format('슬롯 환불 - %s일 후 자동 처리 (%s)', v_delay_days, refund.campaign_name),
        refund.slot_id,  -- reference_id는 UUID 타입
        NOW(),
        'paid'  -- 무조건 유료 캐시로 환불
      );

      -- slot_pending_balances 상태 변경 (refund로 통일)
      UPDATE slot_pending_balances 
      SET status = 'refund',  -- refunded가 아닌 refund
          processed_at = NOW()
      WHERE slot_id = refund.slot_id;

      -- slots 상태 변경 (refund로 통일)
      UPDATE slots
      SET status = 'refund',  -- refunded가 아닌 refund
          updated_at = NOW()
      WHERE id = refund.slot_id;

      -- 환불 처리 로그 기록
      INSERT INTO refund_process_logs (
        refund_request_id,
        slot_id,
        user_id,
        amount,
        scheduled_date,
        status
      ) VALUES (
        refund.refund_request_id,
        refund.slot_id,
        refund.advertiser_id,
        refund.amount,
        v_scheduled_date,
        'success'
      );

      -- 알림 생성
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        status,
        created_at
      ) VALUES (
        refund.advertiser_id,
        'slot_refund',
        '환불 완료',
        format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
          to_char(refund.amount, 'FM999,999,999')),
        'medium',
        'unread',
        NOW()
      );

      v_success_count := v_success_count + 1;
      v_total_amount := v_total_amount + refund.amount;

    EXCEPTION WHEN OTHERS THEN
      -- 실패한 경우 로그 기록
      INSERT INTO refund_process_logs (
        refund_request_id,
        slot_id,
        user_id,
        amount,
        scheduled_date,
        status,
        error_message
      ) VALUES (
        refund.refund_request_id,
        refund.slot_id,
        refund.advertiser_id,
        refund.amount,
        v_scheduled_date,
        'failed',
        SQLERRM
      );
      
      v_failed_count := v_failed_count + 1;
      
      -- 개별 실패는 다음 건 처리를 위해 계속 진행
      CONTINUE;
    END;
  END LOOP;

  -- 결과 반환
  RETURN QUERY 
  SELECT 
    v_processed_count,
    v_success_count,
    v_failed_count,
    v_total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 환불 대기 현황 조회 뷰 (동적 스케줄 기반)
CREATE OR REPLACE VIEW v_dynamic_pending_refunds AS
SELECT 
  sra.id as refund_request_id,
  sra.slot_id,
  sra.refund_amount,
  sra.approved_amount,
  COALESCE(sra.approved_amount, sra.refund_amount) as actual_refund_amount,
  sra.refund_reason,
  sra.request_date,
  sra.approval_date,
  c.refund_settings,
  c.refund_settings->>'type' as refund_type,
  COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3) as delay_days,
  sra.approval_date + (COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3) || ' days')::INTERVAL as scheduled_refund_date,
  CASE 
    WHEN sra.approval_date + (COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3) || ' days')::INTERVAL <= NOW() THEN '처리 대기'
    ELSE '예약됨'
  END as processing_status,
  s.user_id as advertiser_id,  -- user_id가 광고주 ID (수정됨)
  u.full_name as advertiser_name,
  c.campaign_name,
  approver.full_name as approver_name
FROM slot_refund_approvals sra
JOIN slots s ON sra.slot_id = s.id
JOIN users u ON s.user_id = u.id  -- user_id로 조인 (수정됨)
JOIN campaigns c ON s.product_id = c.id
LEFT JOIN users approver ON sra.approver_id = approver.id
WHERE sra.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM refund_process_logs rpl 
  WHERE rpl.refund_request_id = sra.id 
  AND rpl.status = 'success'
)
ORDER BY scheduled_refund_date;

-- 기존 스케줄러가 있다면 제거하고 새로운 동적 함수로 교체
-- 매일 오전 9시와 오후 6시에 실행
/*
-- pg_cron을 사용하는 경우
SELECT cron.unschedule('process-scheduled-refunds');
SELECT cron.schedule(
  'process-scheduled-refunds',
  '0 9,18 * * *',
  $$SELECT process_scheduled_refunds();$$
);
*/

-- 테스트: 특정 캠페인의 환불 정책 확인
CREATE OR REPLACE FUNCTION test_campaign_refund_settings()
RETURNS TABLE (
  campaign_id INTEGER,
  campaign_name VARCHAR,
  refund_type TEXT,
  delay_days INTEGER,
  requires_approval BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.campaign_name,
    c.refund_settings->>'type',
    (c.refund_settings->>'delay_days')::INTEGER,
    (c.refund_settings->>'requires_approval')::BOOLEAN
  FROM campaigns c
  WHERE c.refund_settings IS NOT NULL
  ORDER BY c.id;
END;
$$ LANGUAGE plpgsql;

-- 테스트: 현재 대기 중인 환불 건들과 예정 처리 시간
CREATE OR REPLACE FUNCTION test_pending_dynamic_refunds()
RETURNS TABLE (
  refund_id UUID,
  advertiser_id UUID,
  approval_date TIMESTAMP WITH TIME ZONE,
  campaign_name VARCHAR,
  refund_type TEXT,
  delay_days INTEGER,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sra.id,
    s.user_id,  -- user_id가 광고주 ID (수정됨)
    sra.approval_date,
    c.campaign_name,
    c.refund_settings->>'type',
    COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3),
    sra.approval_date + (COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3) || ' days')::INTERVAL,
    CASE 
      WHEN sra.approval_date + (COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3) || ' days')::INTERVAL <= NOW() 
      THEN '처리 가능'
      ELSE '대기 중'
    END
  FROM slot_refund_approvals sra
  JOIN slots s ON sra.slot_id = s.id
  JOIN campaigns c ON s.product_id = c.id
  WHERE sra.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM refund_process_logs rpl 
    WHERE rpl.refund_request_id = sra.id 
    AND rpl.status = 'success'
  )
  ORDER BY sra.approval_date + (COALESCE((c.refund_settings->>'delay_days')::INTEGER, 3) || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 시뮬레이션 함수: 기존 리턴 타입 유지하면서 동적 환불 정책 적용
DROP FUNCTION IF EXISTS simulate_single_refund(UUID);

CREATE OR REPLACE FUNCTION simulate_single_refund(p_refund_request_id UUID)
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  record_id TEXT,
  changes JSONB,
  error TEXT
) AS $$
DECLARE
  v_result JSONB;
  v_refund RECORD;
  v_balance_after RECORD;
  v_refund_settings JSONB;
  v_delay_days INTEGER;
  v_scheduled_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 환불 요청 정보와 캠페인 설정 조회
  SELECT 
    sra.id as refund_request_id,
    sra.slot_id,
    COALESCE(sra.approved_amount, sra.refund_amount) as amount,
    sra.approval_date,
    s.user_id as advertiser_id,  -- user_id가 광고주 ID
    c.refund_settings,
    c.campaign_name
  INTO v_refund
  FROM slot_refund_approvals sra
  JOIN slots s ON sra.slot_id = s.id
  JOIN campaigns c ON s.product_id = c.id
  WHERE sra.id = p_refund_request_id
  AND sra.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM refund_process_logs rpl 
    WHERE rpl.refund_request_id = sra.id 
    AND rpl.status = 'success'
  );

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 'error'::TEXT,
           'not_found'::TEXT,
           p_refund_request_id::TEXT,
           jsonb_build_object('message', '처리 가능한 환불 건을 찾을 수 없습니다.'),
           '처리 가능한 환불 건을 찾을 수 없습니다.'::TEXT;
    RETURN;
  END IF;

  -- 환불 설정 확인
  v_refund_settings := v_refund.refund_settings;
  
  -- 환불 지연 일수 계산
  IF v_refund_settings IS NULL THEN
    v_delay_days := 3;
  ELSIF v_refund_settings->>'type' = 'immediate' THEN
    v_delay_days := 0;
  ELSIF v_refund_settings->>'type' = 'delayed' THEN
    v_delay_days := COALESCE((v_refund_settings->>'delay_days')::INTEGER, 3);
  ELSE
    v_delay_days := 3;
  END IF;
  
  v_scheduled_date := v_refund.approval_date + (v_delay_days || ' days')::INTERVAL;

  -- 예정 시간 확인
  IF v_scheduled_date > NOW() THEN
    RETURN QUERY
    SELECT 'error'::TEXT,
           'not_ready'::TEXT,
           p_refund_request_id::TEXT,
           jsonb_build_object(
             'message', format('아직 환불 예정 시간이 되지 않았습니다. 예정 시간: %s', v_scheduled_date),
             'scheduled_date', v_scheduled_date,
             'delay_days', v_delay_days,
             'refund_type', v_refund_settings->>'type'
           ),
           format('환불 예정 시간: %s', v_scheduled_date)::TEXT;
    RETURN;
  END IF;

  -- 시뮬레이션 결과를 TABLE 형식으로 반환
  RETURN QUERY
  SELECT 'refund_info'::TEXT, 
         'check'::TEXT, 
         v_refund.refund_request_id::TEXT,
         jsonb_build_object(
           'amount', v_refund.amount,
           'advertiser_id', v_refund.advertiser_id,
           'campaign_name', v_refund.campaign_name,
           'refund_type', v_refund_settings->>'type',
           'delay_days', v_delay_days,
           'scheduled_date', v_scheduled_date,
           'can_process', true
         ),
         NULL::TEXT;
         
  -- user_balances 업데이트 시뮬레이션
  RETURN QUERY
  SELECT 'user_balances'::TEXT,
         'update'::TEXT,
         v_refund.advertiser_id::TEXT,
         jsonb_build_object(
           'paid_balance', format('+%s', v_refund.amount),
           'total_balance', format('+%s', v_refund.amount),
           'change_amount', v_refund.amount
         ),
         NULL::TEXT;
         
  -- user_cash_history 추가 시뮬레이션
  RETURN QUERY
  SELECT 'user_cash_history'::TEXT,
         'insert'::TEXT,
         gen_random_uuid()::TEXT,
         jsonb_build_object(
           'user_id', v_refund.advertiser_id,
           'amount', v_refund.amount::INTEGER,
           'transaction_type', 'refund',
           'description', format('슬롯 환불 - %s일 후 자동 처리 (%s)', v_delay_days, v_refund.campaign_name),
           'reference_id', v_refund.slot_id,
           'balance_type', 'paid'
         ),
         NULL::TEXT;
         
  -- slots 상태 변경 시뮬레이션
  RETURN QUERY
  SELECT 'slots'::TEXT,
         'update'::TEXT,
         v_refund.slot_id::TEXT,
         jsonb_build_object(
           'status', 'refund',
           'previous_status', 'approved'
         ),
         NULL::TEXT;
         
  -- slot_pending_balances 상태 변경 시뮬레이션
  RETURN QUERY
  SELECT 'slot_pending_balances'::TEXT,
         'update'::TEXT,
         v_refund.slot_id::TEXT,
         jsonb_build_object(
           'status', 'refund',
           'processed_at', NOW()
         ),
         NULL::TEXT;
         
  -- 알림 생성 시뮬레이션
  RETURN QUERY
  SELECT 'notifications'::TEXT,
         'insert'::TEXT,
         gen_random_uuid()::TEXT,
         jsonb_build_object(
           'user_id', v_refund.advertiser_id,
           'type', 'slot_refund',
           'title', '환불 완료',
           'message', format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', to_char(v_refund.amount, 'FM999,999,999')),
           'priority', 'medium'
         ),
         NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 전체 환불 프로세스 시뮬레이션 (기존 리턴 타입 유지)
DROP FUNCTION IF EXISTS simulate_refund_process();

CREATE OR REPLACE FUNCTION simulate_refund_process()
RETURNS TABLE (
  table_name TEXT,
  action TEXT,
  record_id TEXT,
  changes JSONB,
  error TEXT
) AS $$
DECLARE
  v_pending_refunds INTEGER;
  v_processable_refunds INTEGER;
  v_total_amount DECIMAL;
  v_refund RECORD;
  v_delay_days INTEGER;
  v_scheduled_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 대기중인 환불 건수 계산
  SELECT COUNT(*) INTO v_pending_refunds
  FROM slot_refund_approvals sra
  WHERE sra.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM refund_process_logs rpl 
    WHERE rpl.refund_request_id = sra.id 
    AND rpl.status = 'success'
  );

  -- 처리 가능한 환불 건수와 금액 계산
  v_processable_refunds := 0;
  v_total_amount := 0;
  
  FOR v_refund IN
    SELECT 
      sra.id,
      sra.slot_id,
      COALESCE(sra.approved_amount, sra.refund_amount) as amount,
      sra.approval_date,
      c.refund_settings,
      c.campaign_name,
      s.user_id as advertiser_id
    FROM slot_refund_approvals sra
    JOIN slots s ON sra.slot_id = s.id
    JOIN campaigns c ON s.product_id = c.id
    WHERE sra.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM refund_process_logs rpl 
      WHERE rpl.refund_request_id = sra.id 
      AND rpl.status = 'success'
    )
  LOOP
      -- 환불 지연 일수 계산
      IF v_refund.refund_settings IS NULL THEN
        v_delay_days := 3;
      ELSIF v_refund.refund_settings->>'type' = 'immediate' THEN
        v_delay_days := 0;
      ELSIF v_refund.refund_settings->>'type' = 'delayed' THEN
        v_delay_days := COALESCE((v_refund.refund_settings->>'delay_days')::INTEGER, 3);
      ELSE
        v_delay_days := 3;
      END IF;
      
      v_scheduled_date := v_refund.approval_date + (v_delay_days || ' days')::INTERVAL;
      
      IF v_scheduled_date <= NOW() THEN
        v_processable_refunds := v_processable_refunds + 1;
        v_total_amount := v_total_amount + v_refund.amount;
        
        -- 각 처리 가능한 환불 건 반환
        RETURN QUERY
        SELECT 'slot_refund_approvals'::TEXT,
               'process'::TEXT,
               v_refund.id::TEXT,
               jsonb_build_object(
                 'slot_id', v_refund.slot_id,
                 'amount', v_refund.amount,
                 'campaign_name', v_refund.campaign_name,
                 'delay_days', v_delay_days,
                 'scheduled_date', v_scheduled_date,
                 'advertiser_id', v_refund.advertiser_id
               ),
               NULL::TEXT;
               
        -- user_balances 업데이트 예정
        RETURN QUERY
        SELECT 'user_balances'::TEXT,
               'will_update'::TEXT,
               v_refund.advertiser_id::TEXT,
               jsonb_build_object(
                 'paid_balance', format('+%s', v_refund.amount),
                 'total_balance', format('+%s', v_refund.amount),
                 'change_amount', v_refund.amount
               ),
               NULL::TEXT;
               
        -- user_cash_history 추가 예정
        RETURN QUERY
        SELECT 'user_cash_history'::TEXT,
               'will_insert'::TEXT,
               'pending'::TEXT,
               jsonb_build_object(
                 'user_id', v_refund.advertiser_id,
                 'amount', v_refund.amount::INTEGER,
                 'transaction_type', 'refund',
                 'description', format('슬롯 환불 - %s일 후 자동 처리 (%s)', v_delay_days, v_refund.campaign_name),
                 'balance_type', 'paid'
               ),
               NULL::TEXT;
               
        -- slots 상태 변경 예정
        RETURN QUERY
        SELECT 'slots'::TEXT,
               'will_update'::TEXT,
               v_refund.slot_id::TEXT,
               jsonb_build_object(
                 'status', 'refund',
                 'current_status', 'approved'
               ),
               NULL::TEXT;
               
        -- slot_pending_balances 상태 변경 예정
        RETURN QUERY
        SELECT 'slot_pending_balances'::TEXT,
               'will_update'::TEXT,
               v_refund.slot_id::TEXT,
               jsonb_build_object(
                 'status', 'refund',
                 'processed_at', '처리 예정'
               ),
               NULL::TEXT;
      END IF;
  END LOOP;

  -- 요약 정보 반환
  RETURN QUERY
  SELECT 'summary'::TEXT,
         'info'::TEXT,
         'process_summary'::TEXT,
         jsonb_build_object(
           'pending_refunds', v_pending_refunds,
           'processable_refunds', v_processable_refunds,
           'total_refund_amount', v_total_amount,
           'message', format('%s건 중 %s건이 처리 가능합니다', v_pending_refunds, v_processable_refunds)
         ),
         NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;