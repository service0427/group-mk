-- slot_modification_requests 테이블 관련 설정

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_slot_modification_requests_slot_id 
ON slot_modification_requests(slot_id);

CREATE INDEX IF NOT EXISTS idx_slot_modification_requests_requester_id 
ON slot_modification_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_slot_modification_requests_approver_id 
ON slot_modification_requests(approver_id);

CREATE INDEX IF NOT EXISTS idx_slot_modification_requests_status 
ON slot_modification_requests(status);

CREATE INDEX IF NOT EXISTS idx_slot_modification_requests_request_date 
ON slot_modification_requests(request_date DESC);

-- 상태 체크 제약 조건 추가 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'slot_modification_requests_status_check'
  ) THEN
    ALTER TABLE slot_modification_requests 
    ADD CONSTRAINT slot_modification_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
  END IF;
END $$;

-- request_type 체크 제약 조건 추가 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'slot_modification_requests_type_check'
  ) THEN
    ALTER TABLE slot_modification_requests 
    ADD CONSTRAINT slot_modification_requests_type_check 
    CHECK (request_type IN ('keyword', 'mid', 'both', 'url'));
  END IF;
END $$;

-- RLS는 사용하지 않음 (권한 체크는 애플리케이션 레벨에서 처리)

-- 수정 요청 승인 처리 함수
CREATE OR REPLACE FUNCTION approve_slot_modification_request(
  p_request_id UUID,
  p_approver_id UUID,
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_result JSONB;
  v_keyword_field TEXT;
  v_new_keyword TEXT;
  v_slot_user_id UUID;
BEGIN
  -- 요청 정보 조회
  SELECT * INTO v_request
  FROM slot_modification_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '대기 중인 수정 요청을 찾을 수 없습니다.'
    );
  END IF;
  
  -- 트랜잭션 시작
  BEGIN
    -- 1. 수정 요청 상태 업데이트
    UPDATE slot_modification_requests
    SET 
      status = 'approved',
      approver_id = p_approver_id,
      approval_notes = p_approval_notes,
      approval_date = NOW(),
      updated_at = NOW()
    WHERE id = p_request_id;
    
    -- 2. 슬롯의 input_data 업데이트
    UPDATE slots
    SET 
      input_data = input_data || v_request.new_data,
      updated_at = NOW()
    WHERE id = v_request.slot_id;
    
    -- 2-2. 키워드가 변경된 경우 keyword_id를 null로 리셋 (새 키워드로 재매칭 필요)
    IF v_request.request_type IN ('keyword', 'both') THEN
      UPDATE slots
      SET keyword_id = NULL
      WHERE id = v_request.slot_id;
    END IF;
    
    -- 2-1. 키워드 변경 시 search_keywords 처리는 애플리케이션 레벨에서 API를 통해 처리
    -- (슬롯 승인 프로세스와 동일하게 checkSingleKeywordRanking API 사용)
    
    -- 3. 슬롯 이력 로그 추가
    INSERT INTO slot_history_logs (
      slot_id,
      user_id,
      action,
      old_status,
      new_status,
      details,
      created_at
    )
    SELECT 
      v_request.slot_id,
      p_approver_id,
      'modification_approved',
      status,
      status,
      jsonb_build_object(
        'request_id', p_request_id,
        'request_type', v_request.request_type,
        'old_data', v_request.old_data,
        'new_data', v_request.new_data,
        'approval_notes', p_approval_notes
      ),
      NOW()
    FROM slots
    WHERE id = v_request.slot_id;
    
    -- 4. 요청자에게 알림 생성
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority,
      status,
      created_at
    ) VALUES (
      v_request.requester_id,
      'slot',
      '슬롯 수정 요청 승인됨',
      format('요청하신 슬롯 수정이 승인되었습니다. 요청 유형: %s', 
        CASE v_request.request_type
          WHEN 'keyword' THEN '키워드'
          WHEN 'mid' THEN 'MID'
          WHEN 'both' THEN '키워드 및 MID'
          WHEN 'url' THEN 'URL'
          ELSE v_request.request_type
        END
      ),
      'medium',
      'unread',
      NOW()
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'message', '수정 요청이 승인되었습니다.',
      'request_id', p_request_id
    );
    
  EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
      'success', false,
      'message', '수정 요청 승인 중 오류가 발생했습니다.',
      'error', SQLERRM
    );
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 수정 요청 반려 처리 함수
CREATE OR REPLACE FUNCTION reject_slot_modification_request(
  p_request_id UUID,
  p_approver_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_result JSONB;
BEGIN
  -- 요청 정보 조회
  SELECT * INTO v_request
  FROM slot_modification_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '대기 중인 수정 요청을 찾을 수 없습니다.'
    );
  END IF;
  
  -- 수정 요청 상태 업데이트
  UPDATE slot_modification_requests
  SET 
    status = 'rejected',
    approver_id = p_approver_id,
    approval_notes = p_rejection_reason,
    approval_date = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- 슬롯 이력 로그 추가
  INSERT INTO slot_history_logs (
    slot_id,
    user_id,
    action,
    old_status,
    new_status,
    details,
    created_at
  )
  SELECT 
    v_request.slot_id,
    p_approver_id,
    'modification_rejected',
    status,
    status,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_type', v_request.request_type,
      'rejection_reason', p_rejection_reason
    ),
    NOW()
  FROM slots
  WHERE id = v_request.slot_id;
  
  -- 요청자에게 알림 생성
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    priority,
    status,
    created_at
  ) VALUES (
    v_request.requester_id,
    'slot',
    '슬롯 수정 요청 반려됨',
    format('요청하신 슬롯 수정이 반려되었습니다. 사유: %s', p_rejection_reason),
    'medium',
    'unread',
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', '수정 요청이 반려되었습니다.',
    'request_id', p_request_id
  );
END;
$$ LANGUAGE plpgsql;

-- 대기 중인 수정 요청 확인 뷰
CREATE OR REPLACE VIEW v_pending_modification_requests AS
SELECT 
  smr.id,
  smr.slot_id,
  smr.requester_id,
  smr.status,
  smr.request_type,
  smr.old_data,
  smr.new_data,
  smr.request_reason,
  smr.request_date,
  s.user_slot_number,
  s.mat_id,
  s.product_id,
  s.status as slot_status,
  u_requester.full_name as requester_name,
  u_mat.full_name as mat_name,
  c.campaign_name,
  c.service_type
FROM slot_modification_requests smr
JOIN slots s ON smr.slot_id = s.id
JOIN users u_requester ON smr.requester_id = u_requester.id
JOIN users u_mat ON s.mat_id = u_mat.id
JOIN campaigns c ON s.product_id = c.id
WHERE smr.status = 'pending'
ORDER BY smr.request_date DESC;

-- Realtime 설정 (선택적)
ALTER PUBLICATION supabase_realtime ADD TABLE slot_modification_requests;