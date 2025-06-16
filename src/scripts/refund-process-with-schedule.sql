-- slot_refund_approvals 테이블에 승인 금액 필드 추가
-- refund_amount는 원래 신청 금액으로 유지
-- approved_amount는 총판이 승인한 실제 환불 금액

-- 1. approved_amount 컬럼 추가
ALTER TABLE slot_refund_approvals 
ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(10,2);

-- 2. 기존 데이터에 대해 approved_amount를 refund_amount와 동일하게 설정
UPDATE slot_refund_approvals 
SET approved_amount = refund_amount 
WHERE approved_amount IS NULL AND status = 'approved';

-- 3. 향후 approved 상태일 때는 approved_amount가 필수가 되도록 체크 제약 추가
ALTER TABLE slot_refund_approvals 
ADD CONSTRAINT check_approved_amount 
CHECK (
  (status != 'approved') OR 
  (status = 'approved' AND approved_amount IS NOT NULL AND approved_amount > 0)
);

-- 4. 코멘트 추가
COMMENT ON COLUMN slot_refund_approvals.refund_amount IS '사용자가 신청한 원래 환불 금액';
COMMENT ON COLUMN slot_refund_approvals.approved_amount IS '총판이 승인한 실제 환불 금액';

-- 환불 프로세스 및 스케줄 관리를 위한 SQL
-- 3일 후 자동 환불 처리 시스템
-- Cron job을 이용한 자동 환불 처리

-- 1. 환불 로그 테이블 생성 (처리 결과 추적용)
CREATE TABLE IF NOT EXISTS refund_process_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  refund_request_id UUID REFERENCES slot_refund_approvals(id),
  slot_id UUID REFERENCES slots(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_refund_process_logs_slot_id ON refund_process_logs(slot_id);
CREATE INDEX idx_refund_process_logs_processed_date ON refund_process_logs(processed_date);

-- 2. slot_pending_balances 상태 확장 (기존 테이블 수정)
-- 상태: 'pending', 'paid', 'refund_requested', 'refund_scheduled', 'refunded', 'refund_failed'
DO $$ 
BEGIN
  -- status 컬럼에 새로운 값들을 허용하도록 수정
  ALTER TABLE slot_pending_balances DROP CONSTRAINT IF EXISTS slot_pending_balances_status_check;
  ALTER TABLE slot_pending_balances ADD CONSTRAINT slot_pending_balances_status_check 
    CHECK (status IN ('pending', 'paid', 'refund_requested', 'refund_scheduled', 'refunded', 'refund_failed'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 3. 환불 처리 함수 (3일 지난 환불 승인 건 자동 처리)
-- slot_pending_balances 테이블에는 updated_at 컬럼이 없음
-- created_at과 processed_at만 존재함
-- SQL 함수에서 updated_at 참조를 제거해야 함

-- process_scheduled_refunds 함수 수정
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
  v_balance_after DECIMAL;
BEGIN
  -- 3일 지난 승인된 환불 요청들을 조회
  FOR refund IN 
    SELECT 
      sra.id as refund_request_id,
      sra.slot_id,
      COALESCE(sra.approved_amount, sra.refund_amount) as amount,
      sra.approval_date,
      s.mat_id as advertiser_id
    FROM slot_refund_approvals sra
    JOIN slots s ON sra.slot_id = s.id
    WHERE sra.status = 'approved' 
    AND sra.approval_date <= NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM refund_process_logs rpl 
      WHERE rpl.refund_request_id = sra.id 
      AND rpl.status = 'success'
    )
    FOR UPDATE
  LOOP
    v_processed_count := v_processed_count + 1;
    
    BEGIN
      -- 트랜잭션 시작

      -- user_balances 업데이트 (광고주에게 환불)
      UPDATE user_balances 
      SET total_balance = total_balance + refund.amount,
          updated_at = NOW()
      WHERE user_id = refund.advertiser_id
      RETURNING total_balance INTO v_balance_after;

      -- cash_histories 기록
      INSERT INTO cash_histories (
        user_id, 
        amount, 
        type, 
        description, 
        balance_after,
        reference_id,
        reference_type,
        created_at
      ) VALUES (
        refund.advertiser_id,
        refund.amount,
        'refund',
        '슬롯 환불 - 3일 후 자동 처리',
        v_balance_after,
        refund.slot_id::TEXT,
        'slot_refund',
        NOW()
      );

      -- slot_pending_balances 상태 변경 (updated_at 제거)
      UPDATE slot_pending_balances 
      SET status = 'refunded',
          processed_at = NOW()
      WHERE slot_id = refund.slot_id;

      -- slots 상태 변경
      UPDATE slots
      SET status = 'refunded',
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
        refund.approval_date + INTERVAL '3 days',
        'success'
      );

      -- 알림 생성 (광고주에게)
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
        'slot_refund',  -- 올바른 type 값
        '환불 완료',
        format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', to_char(refund.amount, 'FM999,999,999')),
        'medium',  -- 올바른 priority 값
        'unread',  -- 기본 status 값
        NOW()
      );

      v_success_count := v_success_count + 1;
      v_total_amount := v_total_amount + refund.amount;

    EXCEPTION WHEN OTHERS THEN
      -- 오류 로그 기록
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
        refund.approval_date + INTERVAL '3 days',
        'failed',
        SQLERRM
      );

      -- 실패한 경우 상태를 refund_failed로 변경 (updated_at 제거)
      UPDATE slot_pending_balances 
      SET status = 'refund_failed',
          processed_at = NOW()
      WHERE slot_id = refund.slot_id;

      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed_count, v_success_count, v_failed_count, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- 4. 수동으로 특정 환불 처리하는 함수 (테스트용)
CREATE OR REPLACE FUNCTION process_single_refund(p_refund_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_refund RECORD;
  v_balance_after DECIMAL;
BEGIN
  -- 환불 요청 정보 조회
  SELECT 
    sra.id as refund_request_id,
    sra.slot_id,
    COALESCE(sra.approved_amount, sra.refund_amount) as amount,
    sra.approval_date,
    s.mat_id as advertiser_id
  INTO v_refund
  FROM slot_refund_approvals sra
  JOIN slots s ON sra.slot_id = s.id
  WHERE sra.id = p_refund_request_id
  AND sra.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM refund_process_logs rpl 
    WHERE rpl.refund_request_id = sra.id 
    AND rpl.status = 'success'
  );

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '처리 가능한 환불 건을 찾을 수 없습니다.'
    );
  END IF;

  BEGIN
    -- 환불 처리 로직
    
    UPDATE user_balances 
    SET total_balance = total_balance + v_refund.amount,
        updated_at = NOW()
    WHERE user_id = v_refund.advertiser_id
    RETURNING total_balance INTO v_balance_after;

    INSERT INTO cash_histories (
      user_id, amount, type, description, balance_after,
      reference_id, reference_type, created_at
    ) VALUES (
      v_refund.advertiser_id, v_refund.amount, 'refund',
      '슬롯 환불 - 즉시 처리', v_balance_after,
      v_refund.slot_id::TEXT, 'slot_refund', NOW()
    );

    -- slot_pending_balances 상태 변경 (updated_at 제거)
    UPDATE slot_pending_balances 
    SET status = 'refunded',
        processed_at = NOW()
    WHERE slot_id = v_refund.slot_id;

    UPDATE slots 
    SET status = 'refunded', 
        updated_at = NOW()
    WHERE id = v_refund.slot_id;

    -- 환불 처리 로그 기록
    INSERT INTO refund_process_logs (
      refund_request_id, slot_id, user_id, amount,
      scheduled_date, status
    ) VALUES (
      v_refund.refund_request_id, v_refund.slot_id, v_refund.advertiser_id,
      v_refund.amount, NOW(), 'success'
    );

    INSERT INTO notifications (
      user_id, type, title, message, priority, status, created_at
    ) VALUES (
      v_refund.advertiser_id, 'slot_refund', '환불 완료',
      format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
        to_char(v_refund.amount, 'FM999,999,999')),
      'medium', 'unread', NOW()
    );

    v_result := jsonb_build_object(
      'success', true,
      'message', '환불이 성공적으로 처리되었습니다.',
      'refund_amount', v_refund.amount,
      'user_id', v_refund.advertiser_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- 오류 로그 기록
    INSERT INTO refund_process_logs (
      refund_request_id, slot_id, user_id, amount,
      scheduled_date, status, error_message
    ) VALUES (
      v_refund.refund_request_id, v_refund.slot_id, v_refund.advertiser_id,
      v_refund.amount, NOW(), 'failed', SQLERRM
    );

    -- 실패한 경우 상태를 refund_failed로 변경 (updated_at 제거)
    UPDATE slot_pending_balances 
    SET status = 'refund_failed',
        processed_at = NOW()
    WHERE slot_id = v_refund.slot_id;

    v_result := jsonb_build_object(
      'success', false,
      'message', '환불 처리 중 오류가 발생했습니다.',
      'error', SQLERRM
    );
  END;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 5. 환불 대기 현황 조회 뷰 (3일 후 처리 예정 건들)
CREATE OR REPLACE VIEW v_pending_refunds AS
SELECT 
  sra.id as refund_request_id,
  sra.slot_id,
  sra.refund_amount,
  sra.approved_amount,
  COALESCE(sra.approved_amount, sra.refund_amount) as actual_refund_amount,
  sra.refund_reason,
  sra.request_date,
  sra.approval_date,
  sra.approval_date + INTERVAL '3 days' as scheduled_refund_date,
  CASE 
    WHEN sra.approval_date + INTERVAL '3 days' <= NOW() THEN '처리 대기'
    ELSE '예약됨'
  END as status,
  s.mat_id as advertiser_id,
  u.full_name as advertiser_name,
  c.campaign_name,
  approver.full_name as approver_name
FROM slot_refund_approvals sra
JOIN slots s ON sra.slot_id = s.id
JOIN users u ON s.mat_id = u.id
JOIN campaigns c ON s.product_id = c.id
LEFT JOIN users approver ON sra.approver_id = approver.id
WHERE sra.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM refund_process_logs rpl 
  WHERE rpl.refund_request_id = sra.id 
  AND rpl.status = 'success'
)
ORDER BY sra.approval_date;

-- 6. RLS (Row Level Security) 설정
ALTER TABLE refund_process_logs ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 환불 로그 조회 가능
CREATE POLICY "관리자는 모든 환불 로그 조회" ON refund_process_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('developer', 'operator')
    )
  );

-- 사용자는 자신의 환불 로그만 조회
CREATE POLICY "사용자는 자신의 환불 로그 조회" ON refund_process_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 7. Cron Job 설정 (pg_cron extension 필요)
-- 매일 오전 9시에 환불 처리 실행
SELECT cron.schedule(
  'process-scheduled-refunds',
  '0 9 * * *',
  $$SELECT process_scheduled_refunds();$$
);

-- 9. 테스트용 함수: 특정 슬롯에 대한 테스트 환불 승인 생성
CREATE OR REPLACE FUNCTION create_test_refund_approval(
  p_slot_id UUID,
  p_amount DECIMAL DEFAULT 10000,
  p_reason TEXT DEFAULT '테스트 환불'
) RETURNS UUID AS $$
DECLARE
  v_slot RECORD;
  v_approval_id UUID;
BEGIN
  -- 슬롯 정보 확인
  SELECT * INTO v_slot FROM slots WHERE id = p_slot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '슬롯을 찾을 수 없습니다.';
  END IF;
  
  -- 환불 승인 요청 생성
  INSERT INTO slot_refund_approvals (
    slot_id,
    requester_id,
    refund_amount,
    refund_reason,
    status,
    request_date,
    approval_date,
    approver_id,
    approved_amount,
    approval_notes
  ) VALUES (
    p_slot_id,
    v_slot.mat_id,
    p_amount,
    p_reason,
    'approved',
    NOW() - INTERVAL '4 days', -- 요청일
    NOW() - INTERVAL '3 days', -- 3일 전 승인된 것으로 설정
    v_slot.mat_id,
    p_amount, -- 테스트이므로 동일하게 설정
    '테스트 승인'
  ) RETURNING id INTO v_approval_id;
  
  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql;


-- ==================== 최종수정
-- supabase-table.sql에 정의된 실제 테이블만 사용하도록 수정
-- cash_histories -> user_cash_history
-- balance_after 컬럼이 없으므로 제거

-- process_scheduled_refunds 함수 수정
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
  v_balance_after DECIMAL;
BEGIN
  -- 3일 지난 승인된 환불 요청들을 조회
  FOR refund IN 
    SELECT 
      sra.id as refund_request_id,
      sra.slot_id,
      COALESCE(sra.approved_amount, sra.refund_amount) as amount,
      sra.approval_date,
      s.mat_id as advertiser_id
    FROM slot_refund_approvals sra
    JOIN slots s ON sra.slot_id = s.id
    WHERE sra.status = 'approved' 
    AND sra.approval_date <= NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM refund_process_logs rpl 
      WHERE rpl.refund_request_id = sra.id 
      AND rpl.status = 'success'
    )
    FOR UPDATE
  LOOP
    v_processed_count := v_processed_count + 1;
    
    BEGIN
      -- 트랜잭션 시작

      -- user_balances 업데이트 (광고주에게 환불)
      UPDATE user_balances 
      SET total_balance = total_balance + refund.amount,
          updated_at = NOW()
      WHERE user_id = refund.advertiser_id
      RETURNING total_balance INTO v_balance_after;

      -- user_cash_history 기록 (올바른 테이블명과 컬럼 사용)
      INSERT INTO user_cash_history (
        user_id, 
        amount, 
        transaction_type, 
        description, 
        reference_id,
        transaction_at
      ) VALUES (
        refund.advertiser_id,
        refund.amount::INTEGER,  -- amount는 INTEGER 타입
        'refund',  -- transaction_type
        '슬롯 환불 - 3일 후 자동 처리',
        refund.slot_id,  -- reference_id는 UUID 타입
        NOW()
      );

      -- slot_pending_balances 상태 변경 (updated_at 제거)
      UPDATE slot_pending_balances 
      SET status = 'refunded',
          processed_at = NOW()
      WHERE slot_id = refund.slot_id;

      -- slots 상태 변경
      UPDATE slots
      SET status = 'refunded',
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
        refund.approval_date + INTERVAL '3 days',
        'success'
      );

      -- notifications 테이블이 있는지 확인 필요
      -- 없으면 이 부분은 제거해야 함
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
        'slot_refund',  -- 올바른 type 값
        '환불 완료',
        format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', to_char(refund.amount, 'FM999,999,999')),
        'medium',  -- 올바른 priority 값
        'unread',  -- 기본 status 값
        NOW()
      );

      v_success_count := v_success_count + 1;
      v_total_amount := v_total_amount + refund.amount;

    EXCEPTION WHEN OTHERS THEN
      -- 오류 로그 기록
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
        refund.approval_date + INTERVAL '3 days',
        'failed',
        SQLERRM
      );

      -- 실패한 경우 상태를 refund_failed로 변경 (updated_at 제거)
      UPDATE slot_pending_balances 
      SET status = 'refund_failed',
          processed_at = NOW()
      WHERE slot_id = refund.slot_id;

      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed_count, v_success_count, v_failed_count, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- process_single_refund 함수도 수정
CREATE OR REPLACE FUNCTION process_single_refund(p_refund_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_refund RECORD;
  v_balance_after DECIMAL;
BEGIN
  -- 환불 요청 정보 조회
  SELECT 
    sra.id as refund_request_id,
    sra.slot_id,
    COALESCE(sra.approved_amount, sra.refund_amount) as amount,
    sra.approval_date,
    s.mat_id as advertiser_id
  INTO v_refund
  FROM slot_refund_approvals sra
  JOIN slots s ON sra.slot_id = s.id
  WHERE sra.id = p_refund_request_id
  AND sra.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM refund_process_logs rpl 
    WHERE rpl.refund_request_id = sra.id 
    AND rpl.status = 'success'
  );

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '처리 가능한 환불 건을 찾을 수 없습니다.'
    );
  END IF;

  BEGIN
    -- 환불 처리 로직
    
    UPDATE user_balances 
    SET total_balance = total_balance + v_refund.amount,
        updated_at = NOW()
    WHERE user_id = v_refund.advertiser_id
    RETURNING total_balance INTO v_balance_after;

    -- user_cash_history 기록 (올바른 테이블명과 컬럼 사용)
    INSERT INTO user_cash_history (
      user_id, 
      amount, 
      transaction_type, 
      description, 
      reference_id,
      transaction_at
    ) VALUES (
      v_refund.advertiser_id,
      v_refund.amount::INTEGER,  -- amount는 INTEGER 타입
      'refund',  -- transaction_type
      '슬롯 환불 - 즉시 처리',
      v_refund.slot_id,  -- reference_id는 UUID 타입
      NOW()
    );

    -- slot_pending_balances 상태 변경 (updated_at 제거)
    UPDATE slot_pending_balances 
    SET status = 'refunded',
        processed_at = NOW()
    WHERE slot_id = v_refund.slot_id;

    UPDATE slots 
    SET status = 'refunded', 
        updated_at = NOW()
    WHERE id = v_refund.slot_id;

    -- 환불 처리 로그 기록
    INSERT INTO refund_process_logs (
      refund_request_id, slot_id, user_id, amount,
      scheduled_date, status
    ) VALUES (
      v_refund.refund_request_id, v_refund.slot_id, v_refund.advertiser_id,
      v_refund.amount, NOW(), 'success'
    );

    INSERT INTO notifications (
      user_id, type, title, message, priority, status, created_at
    ) VALUES (
      v_refund.advertiser_id, 'slot_refund', '환불 완료',
      format('요청하신 환불이 완료되었습니다. 환불 금액: %s원', 
        to_char(v_refund.amount, 'FM999,999,999')),
      'medium', 'unread', NOW()
    );

    v_result := jsonb_build_object(
      'success', true,
      'message', '환불이 성공적으로 처리되었습니다.',
      'refund_amount', v_refund.amount,
      'user_id', v_refund.advertiser_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- 오류 로그 기록
    INSERT INTO refund_process_logs (
      refund_request_id, slot_id, user_id, amount,
      scheduled_date, status, error_message
    ) VALUES (
      v_refund.refund_request_id, v_refund.slot_id, v_refund.advertiser_id,
      v_refund.amount, NOW(), 'failed', SQLERRM
    );

    -- 실패한 경우 상태를 refund_failed로 변경 (updated_at 제거)
    UPDATE slot_pending_balances 
    SET status = 'refund_failed',
        processed_at = NOW()
    WHERE slot_id = v_refund.slot_id;

    v_result := jsonb_build_object(
      'success', false,
      'message', '환불 처리 중 오류가 발생했습니다.',
      'error', SQLERRM
    );
  END;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;