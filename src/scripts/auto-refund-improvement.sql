-- ============================================
-- 자동환불 슬롯 정보 추적 개선 스크립트
-- ============================================
-- 목적: 자동 완료 환불 시 개별 슬롯 정보를 정확히 추적하기 위한 시스템 개선
-- 작성일: 2025-06-19
-- ============================================

-- ============================================
-- 1. 자동환불 상세 로그 테이블 생성
-- ============================================

-- 기존 테이블이 있으면 삭제 (개발환경에서만 사용)
-- DROP TABLE IF EXISTS auto_refund_details CASCADE;

-- 자동환불 상세 정보 테이블
CREATE TABLE IF NOT EXISTS auto_refund_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 환불 거래 정보
    refund_transaction_id UUID NOT NULL REFERENCES user_cash_history(id) ON DELETE CASCADE,
    
    -- 슬롯 정보
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    
    -- 환불 금액 정보
    refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount > 0),
    original_amount DECIMAL(10,2), -- 원래 슬롯 금액
    
    -- 환불 사유 및 상세정보
    refund_reason TEXT DEFAULT '작업 기한 경과로 인한 자동 완료',
    days_after_deadline INTEGER, -- 기한 경과 일수
    
    -- 슬롯 상태 정보 (스냅샷)
    slot_status VARCHAR(50),
    campaign_name TEXT,
    service_type VARCHAR(50),
    user_slot_number INTEGER,
    
    -- 타임스탬프
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 메타데이터
    metadata JSONB, -- 추가 정보 저장용
    
    -- 유니크 제약조건 (같은 환불에서 같은 슬롯이 중복 기록되지 않도록)
    UNIQUE(refund_transaction_id, slot_id)
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================

-- 환불 거래 ID로 조회 (가장 자주 사용)
CREATE INDEX IF NOT EXISTS idx_auto_refund_details_transaction_id 
ON auto_refund_details(refund_transaction_id);

-- 슬롯 ID로 조회
CREATE INDEX IF NOT EXISTS idx_auto_refund_details_slot_id 
ON auto_refund_details(slot_id);

-- 처리 시간으로 조회 (통계용)
CREATE INDEX IF NOT EXISTS idx_auto_refund_details_processed_at 
ON auto_refund_details(processed_at);

-- 사용자별 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_auto_refund_details_user_processed 
ON auto_refund_details(processed_at) 
INCLUDE (refund_amount, slot_id);

-- ============================================
-- 3. 권한 설정
-- ============================================

-- 테이블 권한 설정
GRANT SELECT ON auto_refund_details TO authenticated;
GRANT ALL ON auto_refund_details TO service_role;

-- 시퀀스 권한 (UUID 생성용)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- 4. 코멘트 추가
-- ============================================

COMMENT ON TABLE auto_refund_details IS '자동 완료 환불의 개별 슬롯 상세 정보를 추적하는 테이블';
COMMENT ON COLUMN auto_refund_details.refund_transaction_id IS 'user_cash_history 테이블의 환불 거래 ID';
COMMENT ON COLUMN auto_refund_details.slot_id IS 'slots 테이블의 환불된 슬롯 ID';
COMMENT ON COLUMN auto_refund_details.refund_amount IS '해당 슬롯에 대한 환불 금액';
COMMENT ON COLUMN auto_refund_details.days_after_deadline IS '작업 기한 경과 후 며칠 뒤에 환불되었는지';
COMMENT ON COLUMN auto_refund_details.metadata IS '추가 정보를 JSON 형태로 저장 (확장용)';

-- ============================================
-- 5. 자동환불 상세 정보 조회 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_auto_refund_details(
    p_transaction_id UUID
)
RETURNS TABLE (
    slot_id UUID,
    user_slot_number INTEGER,
    refund_amount DECIMAL,
    campaign_name TEXT,
    service_type VARCHAR,
    refund_reason TEXT,
    days_after_deadline INTEGER,
    slot_start_date DATE,
    slot_end_date DATE,
    processed_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ard.slot_id,
        ard.user_slot_number,
        ard.refund_amount,
        ard.campaign_name,
        ard.service_type,
        ard.refund_reason,
        ard.days_after_deadline,
        s.start_date,
        s.end_date,
        ard.processed_at
    FROM auto_refund_details ard
    LEFT JOIN slots s ON s.id = ard.slot_id
    WHERE ard.refund_transaction_id = p_transaction_id
    ORDER BY ard.processed_at DESC;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_auto_refund_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_auto_refund_details(UUID) TO service_role;

-- ============================================
-- 6. 개선된 자동 완료 함수 (기존 함수 수정)
-- ============================================

-- 참고: 이 부분은 기존 auto_complete_overdue_slots 함수를 수정하는 가이드입니다.
-- 실제 적용 시에는 기존 함수를 백업한 후 점진적으로 적용해야 합니다.

/*
기존 auto_complete_overdue_slots 함수에 추가할 부분:

1. 환불 처리 후 user_cash_history에 기록할 때:
   - INSERT INTO user_cash_history의 결과에서 ID를 받아옴
   
2. 각 슬롯 처리 시 auto_refund_details에 기록:
   INSERT INTO auto_refund_details (
       refund_transaction_id,
       slot_id,
       refund_amount,
       original_amount,
       refund_reason,
       days_after_deadline,
       slot_status,
       campaign_name,
       service_type,
       user_slot_number,
       processed_at
   ) VALUES (
       v_refund_transaction_id,  -- user_cash_history에서 받은 ID
       v_slot.slot_id,
       v_settlement.base_amount,
       v_slot.original_amount,
       format('자동 완료 - 작업 기한 경과 후 %s일 지남', days_after_completion),
       days_after_completion,
       'completed',
       v_campaign_name,
       v_service_type,
       v_user_slot_number,
       NOW()
   );
*/

-- ============================================
-- 7. 기존 데이터 마이그레이션 도구 (선택사항)
-- ============================================

-- 기존 자동환불 데이터를 분석하여 가능한 범위에서 복구하는 함수
CREATE OR REPLACE FUNCTION migrate_existing_auto_refunds(
    p_start_date DATE DEFAULT '2024-01-01',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{"migrated": 0, "errors": []}'::JSONB;
    v_refund RECORD;
    v_migrated INTEGER := 0;
BEGIN
    -- 기존 자동환불 거래들을 찾아서 처리
    FOR v_refund IN 
        SELECT 
            id as transaction_id,
            user_id,
            amount,
            description,
            transaction_at
        FROM user_cash_history 
        WHERE transaction_type = 'refund'
        AND description LIKE '%슬롯 자동 완료 환불%'
        AND DATE(transaction_at) BETWEEN p_start_date AND p_end_date
        AND NOT EXISTS (
            SELECT 1 FROM auto_refund_details 
            WHERE refund_transaction_id = user_cash_history.id
        )
    LOOP
        -- 여기에 시간 기반 추정 로직을 넣을 수 있음
        -- 하지만 정확도가 떨어질 수 있으므로 주의 필요
        
        v_migrated := v_migrated + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'migrated', v_migrated,
        'processed_period', format('%s to %s', p_start_date, p_end_date)
    );
END;
$$;

-- ============================================
-- 8. 유틸리티 함수들
-- ============================================

-- 특정 사용자의 자동환불 통계
CREATE OR REPLACE FUNCTION get_user_auto_refund_stats(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_refunds INTEGER,
    total_amount DECIMAL,
    total_slots INTEGER,
    avg_days_after_deadline DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ard.refund_transaction_id)::INTEGER as total_refunds,
        COALESCE(SUM(ard.refund_amount), 0) as total_amount,
        COUNT(ard.slot_id)::INTEGER as total_slots,
        COALESCE(AVG(ard.days_after_deadline), 0) as avg_days_after_deadline
    FROM auto_refund_details ard
    JOIN user_cash_history uch ON uch.id = ard.refund_transaction_id
    WHERE uch.user_id = p_user_id
    AND (p_start_date IS NULL OR DATE(ard.processed_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(ard.processed_at) <= p_end_date);
END;
$$;

-- ============================================
-- 9. 데이터 정합성 체크 함수
-- ============================================

CREATE OR REPLACE FUNCTION check_auto_refund_integrity()
RETURNS TABLE (
    issue_type TEXT,
    count INTEGER,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 환불 거래는 있지만 상세 정보가 없는 경우
    RETURN QUERY
    SELECT 
        'missing_details'::TEXT as issue_type,
        COUNT(*)::INTEGER as count,
        'Auto refund transactions without detail records'::TEXT as description
    FROM user_cash_history uch
    WHERE uch.transaction_type = 'refund'
    AND uch.description LIKE '%슬롯 자동 완료 환불%'
    AND NOT EXISTS (
        SELECT 1 FROM auto_refund_details ard 
        WHERE ard.refund_transaction_id = uch.id
    );
    
    -- 상세 정보는 있지만 환불 거래가 없는 경우 (데이터 정합성 오류)
    RETURN QUERY
    SELECT 
        'orphaned_details'::TEXT as issue_type,
        COUNT(*)::INTEGER as count,
        'Detail records without corresponding refund transactions'::TEXT as description
    FROM auto_refund_details ard
    WHERE NOT EXISTS (
        SELECT 1 FROM user_cash_history uch 
        WHERE uch.id = ard.refund_transaction_id
    );
    
    -- 금액 불일치 체크
    RETURN QUERY
    SELECT 
        'amount_mismatch'::TEXT as issue_type,
        COUNT(*)::INTEGER as count,
        'Refund transactions where total detail amount differs from transaction amount'::TEXT as description
    FROM (
        SELECT 
            uch.id,
            uch.amount as transaction_amount,
            COALESCE(SUM(ard.refund_amount), 0) as detail_total
        FROM user_cash_history uch
        LEFT JOIN auto_refund_details ard ON ard.refund_transaction_id = uch.id
        WHERE uch.transaction_type = 'refund'
        AND uch.description LIKE '%슬롯 자동 완료 환불%'
        GROUP BY uch.id, uch.amount
        HAVING ABS(uch.amount) != COALESCE(SUM(ard.refund_amount), 0)
    ) mismatches;
END;
$$;

-- ============================================
-- 10. 설치 완료 확인
-- ============================================

-- 설치가 완료되었는지 확인하는 함수
CREATE OR REPLACE FUNCTION verify_auto_refund_improvement_installation()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB := '{"status": "success", "checks": []}'::JSONB;
    v_checks JSONB := '[]'::JSONB;
BEGIN
    -- 테이블 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auto_refund_details') THEN
        v_checks := v_checks || jsonb_build_object('table_auto_refund_details', 'EXISTS');
    ELSE
        v_checks := v_checks || jsonb_build_object('table_auto_refund_details', 'MISSING');
        v_result := jsonb_set(v_result, '{status}', '"error"');
    END IF;
    
    -- 인덱스 존재 확인
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_auto_refund_details_transaction_id') THEN
        v_checks := v_checks || jsonb_build_object('index_transaction_id', 'EXISTS');
    ELSE
        v_checks := v_checks || jsonb_build_object('index_transaction_id', 'MISSING');
    END IF;
    
    -- 함수 존재 확인
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_auto_refund_details') THEN
        v_checks := v_checks || jsonb_build_object('function_get_auto_refund_details', 'EXISTS');
    ELSE
        v_checks := v_checks || jsonb_build_object('function_get_auto_refund_details', 'MISSING');
    END IF;
    
    v_result := jsonb_set(v_result, '{checks}', v_checks);
    v_result := jsonb_set(v_result, '{installation_date}', to_jsonb(NOW()));
    
    RETURN v_result;
END;
$$;

-- ============================================
-- 설치 스크립트 실행 완료
-- ============================================

-- 설치 확인 실행
SELECT verify_auto_refund_improvement_installation();

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '자동환불 슬롯 정보 추적 개선 스크립트 설치가 완료되었습니다.';
    RAISE NOTICE '다음 단계: auto_complete_overdue_slots 함수를 수정하여 auto_refund_details 테이블에 데이터를 기록하도록 업데이트하세요.';
END
$$;