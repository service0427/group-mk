-- =====================================================
-- 단건형(Per-Unit) 캠페인 함수 및 트리거
-- =====================================================
-- 설명: 비즈니스 로직을 위한 저장 프로시저와 트리거
-- 작성일: 2025-01-06
-- =====================================================

-- =====================================================
-- 1. 유틸리티 함수
-- =====================================================

-- 사용자 역할 확인 함수
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = user_id;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. 캠페인 관련 함수
-- =====================================================

-- 단건형 캠페인 생성 함수
CREATE OR REPLACE FUNCTION create_per_unit_campaign(
    p_campaign_id UUID,
    p_min_quantity INTEGER,
    p_unit_price NUMERIC,
    p_max_quantity INTEGER DEFAULT NULL,
    p_work_period INTEGER DEFAULT 30,
    p_is_negotiable BOOLEAN DEFAULT FALSE,
    p_min_unit_price NUMERIC DEFAULT NULL,
    p_max_unit_price NUMERIC DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_requirements JSONB DEFAULT '{}',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_campaign_type VARCHAR;
    v_per_unit_id UUID;
BEGIN
    -- 캠페인 타입 확인
    SELECT slot_type INTO v_campaign_type
    FROM campaigns
    WHERE id = p_campaign_id;
    
    IF v_campaign_type != 'per-unit' THEN
        RAISE EXCEPTION '캠페인 타입이 per-unit이 아닙니다.';
    END IF;
    
    -- 협상 가능한 경우 가격 범위 검증
    IF p_is_negotiable AND (p_min_unit_price IS NULL OR p_max_unit_price IS NULL) THEN
        RAISE EXCEPTION '협상 가능한 경우 최소/최대 단가를 설정해야 합니다.';
    END IF;
    
    -- 단건형 캠페인 정보 생성
    INSERT INTO per_unit_campaigns (
        campaign_id, min_quantity, unit_price, max_quantity,
        work_period, is_negotiable, min_unit_price, max_unit_price,
        description, requirements, created_by
    ) VALUES (
        p_campaign_id, p_min_quantity, p_unit_price, p_max_quantity,
        p_work_period, p_is_negotiable, p_min_unit_price, p_max_unit_price,
        p_description, p_requirements, COALESCE(p_created_by, auth.uid())
    ) RETURNING id INTO v_per_unit_id;
    
    RETURN v_per_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. 견적 요청 관련 함수
-- =====================================================

-- 견적 요청 생성 함수
CREATE OR REPLACE FUNCTION create_per_unit_request(
    p_campaign_id UUID,
    p_quantity INTEGER,
    p_unit_price NUMERIC DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_preferred_start_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_distributor_id UUID;
    v_min_quantity INTEGER;
    v_max_quantity INTEGER;
    v_is_negotiable BOOLEAN;
    v_min_price NUMERIC;
    v_max_price NUMERIC;
BEGIN
    -- 캠페인 정보 조회
    SELECT c.mat_id, pc.min_quantity, pc.max_quantity, 
           pc.is_negotiable, pc.min_unit_price, pc.max_unit_price
    INTO v_distributor_id, v_min_quantity, v_max_quantity,
         v_is_negotiable, v_min_price, v_max_price
    FROM campaigns c
    JOIN per_unit_campaigns pc ON pc.campaign_id = c.id
    WHERE c.id = p_campaign_id
    AND c.status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '활성화된 캠페인을 찾을 수 없습니다.';
    END IF;
    
    -- 수량 검증
    IF p_quantity < v_min_quantity THEN
        RAISE EXCEPTION '최소 수량 %건 이상부터 신청 가능합니다.', v_min_quantity;
    END IF;
    
    IF v_max_quantity IS NOT NULL AND p_quantity > v_max_quantity THEN
        RAISE EXCEPTION '최대 수량 %건을 초과할 수 없습니다.', v_max_quantity;
    END IF;
    
    -- 가격 검증 (협상 가능한 경우)
    IF v_is_negotiable AND p_unit_price IS NOT NULL THEN
        IF p_unit_price < v_min_price OR p_unit_price > v_max_price THEN
            RAISE EXCEPTION '제안 가격은 %원 ~ %원 범위여야 합니다.', v_min_price, v_max_price;
        END IF;
    END IF;
    
    -- 견적 요청 생성
    INSERT INTO per_unit_slot_requests (
        campaign_id, user_id, distributor_id,
        requested_quantity, requested_unit_price,
        request_message, preferred_start_date
    ) VALUES (
        p_campaign_id, auth.uid(), v_distributor_id,
        p_quantity, p_unit_price,
        p_message, p_preferred_start_date
    ) RETURNING id INTO v_request_id;
    
    -- 알림 생성 (notifications 테이블이 있다고 가정)
    -- INSERT INTO notifications (...) VALUES (...);
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 견적 응답 함수
CREATE OR REPLACE FUNCTION respond_per_unit_request(
    p_request_id UUID,
    p_action VARCHAR, -- 'accept', 'reject', 'negotiate'
    p_unit_price NUMERIC DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_distributor_id UUID;
    v_current_status VARCHAR;
BEGIN
    -- 요청 정보 및 권한 확인
    SELECT distributor_id, status
    INTO v_distributor_id, v_current_status
    FROM per_unit_slot_requests
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '견적 요청을 찾을 수 없습니다.';
    END IF;
    
    IF v_distributor_id != auth.uid() AND get_user_role(auth.uid()) NOT IN ('Developer', 'Operator') THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;
    
    IF v_current_status NOT IN ('requested', 'negotiating') THEN
        RAISE EXCEPTION '이미 처리된 요청입니다.';
    END IF;
    
    -- 액션에 따른 처리
    CASE p_action
        WHEN 'accept' THEN
            UPDATE per_unit_slot_requests
            SET status = 'accepted',
                final_unit_price = COALESCE(p_unit_price, suggested_unit_price),
                responded_at = NOW(),
                accepted_at = NOW()
            WHERE id = p_request_id;
            
        WHEN 'reject' THEN
            UPDATE per_unit_slot_requests
            SET status = 'rejected',
                reject_reason = p_message,
                responded_at = NOW()
            WHERE id = p_request_id;
            
        WHEN 'negotiate' THEN
            UPDATE per_unit_slot_requests
            SET status = 'negotiating',
                suggested_unit_price = p_unit_price,
                responded_at = NOW()
            WHERE id = p_request_id;
            
            -- 협상 메시지 추가
            IF p_message IS NOT NULL THEN
                INSERT INTO per_unit_negotiations (
                    request_id, sender_id, sender_role,
                    message_type, message, proposed_unit_price
                ) VALUES (
                    p_request_id, auth.uid(), 'distributor',
                    'price_proposal', p_message, p_unit_price
                );
            END IF;
            
        ELSE
            RAISE EXCEPTION '잘못된 액션입니다.';
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. 슬롯 구매 관련 함수
-- =====================================================

-- 단건형 슬롯 구매 함수
CREATE OR REPLACE FUNCTION purchase_per_unit_slot(
    p_request_id UUID,
    p_input_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_slot_id UUID;
    v_campaign_id UUID;
    v_distributor_id UUID;
    v_quantity INTEGER;
    v_unit_price NUMERIC;
    v_total_amount NUMERIC;
    v_vat_amount NUMERIC;
    v_user_balance NUMERIC;
    v_work_period INTEGER;
BEGIN
    -- 요청 정보 조회
    SELECT r.campaign_id, r.distributor_id, r.requested_quantity, r.final_unit_price,
           pc.work_period
    INTO v_campaign_id, v_distributor_id, v_quantity, v_unit_price, v_work_period
    FROM per_unit_slot_requests r
    JOIN per_unit_campaigns pc ON pc.campaign_id = r.campaign_id
    WHERE r.id = p_request_id
    AND r.user_id = auth.uid()
    AND r.status = 'accepted';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '승인된 견적을 찾을 수 없습니다.';
    END IF;
    
    -- 금액 계산
    v_total_amount := v_quantity * v_unit_price;
    v_vat_amount := v_total_amount * 0.1; -- VAT 10%
    
    -- 사용자 잔액 확인
    SELECT current_cash INTO v_user_balance
    FROM user_balances
    WHERE user_id = auth.uid();
    
    IF v_user_balance < (v_total_amount + v_vat_amount) THEN
        RAISE EXCEPTION '잔액이 부족합니다. 필요 금액: %원', (v_total_amount + v_vat_amount);
    END IF;
    
    -- 슬롯 생성
    INSERT INTO per_unit_slots (
        campaign_id, request_id, user_id, distributor_id,
        quantity, unit_price, total_amount, vat_amount,
        work_start_date, work_end_date, input_data, status
    ) VALUES (
        v_campaign_id, p_request_id, auth.uid(), v_distributor_id,
        v_quantity, v_unit_price, v_total_amount, v_vat_amount,
        CURRENT_DATE + INTERVAL '1 day',
        CURRENT_DATE + INTERVAL '1 day' + (v_work_period || ' days')::INTERVAL,
        p_input_data, 'pending'
    ) RETURNING id INTO v_slot_id;
    
    -- 홀딩 금액 설정
    INSERT INTO per_unit_holdings (
        slot_id, total_amount, user_holding_amount, distributor_holding_amount
    ) VALUES (
        v_slot_id, v_total_amount, v_total_amount, 0
    );
    
    -- 사용자 잔액 차감
    UPDATE user_balances
    SET current_cash = current_cash - (v_total_amount + v_vat_amount)
    WHERE user_id = auth.uid();
    
    -- 거래 내역 기록
    INSERT INTO per_unit_transactions (
        slot_id, user_id, transaction_type, amount,
        balance_before, balance_after, description
    ) VALUES (
        v_slot_id, auth.uid(), 'purchase', -(v_total_amount + v_vat_amount),
        v_user_balance, v_user_balance - (v_total_amount + v_vat_amount),
        '단건형 슬롯 구매'
    );
    
    -- 요청 상태 업데이트
    UPDATE per_unit_slot_requests
    SET status = 'purchased'
    WHERE id = p_request_id;
    
    RETURN v_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. 작업 실적 관련 함수
-- =====================================================

-- 작업 실적 등록 함수
CREATE OR REPLACE FUNCTION submit_per_unit_work_log(
    p_slot_id UUID,
    p_work_date DATE,
    p_completed_count INTEGER,
    p_work_urls JSONB DEFAULT '[]',
    p_screenshot_urls JSONB DEFAULT '[]',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_distributor_id UUID;
    v_total_completed INTEGER;
    v_slot_quantity INTEGER;
BEGIN
    -- 슬롯 정보 및 권한 확인
    SELECT distributor_id, quantity, completed_quantity
    INTO v_distributor_id, v_slot_quantity, v_total_completed
    FROM per_unit_slots
    WHERE id = p_slot_id
    AND status = 'in_progress';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '진행 중인 슬롯을 찾을 수 없습니다.';
    END IF;
    
    IF v_distributor_id != auth.uid() AND get_user_role(auth.uid()) NOT IN ('Developer', 'Operator') THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;
    
    -- 수량 검증
    IF v_total_completed + p_completed_count > v_slot_quantity THEN
        RAISE EXCEPTION '전체 수량을 초과할 수 없습니다.';
    END IF;
    
    -- 작업 실적 등록
    INSERT INTO per_unit_work_logs (
        slot_id, work_date, completed_count,
        work_urls, screenshot_urls, notes, status
    ) VALUES (
        p_slot_id, p_work_date, p_completed_count,
        p_work_urls, p_screenshot_urls, p_notes, 'pending'
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 작업 실적 승인 함수
CREATE OR REPLACE FUNCTION approve_per_unit_work_log(
    p_log_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_slot_id UUID;
    v_completed_count INTEGER;
    v_status VARCHAR;
BEGIN
    -- 작업 실적 정보 조회
    SELECT slot_id, completed_count, status
    INTO v_slot_id, v_completed_count, v_status
    FROM per_unit_work_logs
    WHERE id = p_log_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '작업 실적을 찾을 수 없습니다.';
    END IF;
    
    IF v_status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 작업 실적입니다.';
    END IF;
    
    -- 권한 확인 (슬롯 소유자 또는 관리자)
    IF NOT EXISTS (
        SELECT 1 FROM per_unit_slots
        WHERE id = v_slot_id
        AND (user_id = auth.uid() OR get_user_role(auth.uid()) IN ('Developer', 'Operator'))
    ) THEN
        RAISE EXCEPTION '권한이 없습니다.';
    END IF;
    
    -- 작업 실적 승인
    UPDATE per_unit_work_logs
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        verification_notes = p_notes
    WHERE id = p_log_id;
    
    -- 슬롯 완료 수량 업데이트
    UPDATE per_unit_slots
    SET completed_quantity = completed_quantity + v_completed_count
    WHERE id = v_slot_id;
    
    -- 전체 완료 확인
    IF EXISTS (
        SELECT 1 FROM per_unit_slots
        WHERE id = v_slot_id
        AND completed_quantity >= quantity
    ) THEN
        UPDATE per_unit_slots
        SET status = 'completed',
            actual_end_date = CURRENT_DATE
        WHERE id = v_slot_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. 정산 관련 함수
-- =====================================================

-- 일별 정산 생성 함수
CREATE OR REPLACE FUNCTION create_per_unit_settlement(
    p_slot_id UUID,
    p_settlement_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    v_settlement_id UUID;
    v_completed_count INTEGER;
    v_unit_price NUMERIC;
    v_settlement_amount NUMERIC;
    v_platform_fee NUMERIC;
    v_distributor_amount NUMERIC;
BEGIN
    -- 승인된 작업 실적 집계
    SELECT COALESCE(SUM(wl.completed_count), 0), s.unit_price
    INTO v_completed_count, v_unit_price
    FROM per_unit_slots s
    LEFT JOIN per_unit_work_logs wl ON wl.slot_id = s.id
        AND wl.status = 'approved'
        AND wl.work_date <= p_settlement_date
        AND NOT EXISTS (
            SELECT 1 FROM per_unit_settlements ps
            WHERE ps.slot_id = s.id
            AND wl.work_date <= ps.settlement_date
        )
    WHERE s.id = p_slot_id
    GROUP BY s.unit_price;
    
    IF v_completed_count = 0 THEN
        RAISE EXCEPTION '정산할 작업 실적이 없습니다.';
    END IF;
    
    -- 정산 금액 계산
    v_settlement_amount := v_completed_count * v_unit_price;
    v_platform_fee := v_settlement_amount * 0.1; -- 플랫폼 수수료 10%
    v_distributor_amount := v_settlement_amount - v_platform_fee;
    
    -- 정산 내역 생성
    INSERT INTO per_unit_settlements (
        slot_id, settlement_date, settlement_type,
        total_completed, settlement_amount,
        platform_fee_rate, platform_fee, distributor_amount,
        status
    ) VALUES (
        p_slot_id, p_settlement_date, 'daily',
        v_completed_count, v_settlement_amount,
        10.0, v_platform_fee, v_distributor_amount,
        'pending'
    ) RETURNING id INTO v_settlement_id;
    
    RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. 환불 관련 함수
-- =====================================================

-- 환불 요청 생성 함수
CREATE OR REPLACE FUNCTION create_per_unit_refund(
    p_slot_id UUID,
    p_refund_type VARCHAR,
    p_refund_quantity INTEGER DEFAULT NULL,
    p_reason_category VARCHAR,
    p_reason_detail TEXT,
    p_evidence_urls JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
    v_refund_id UUID;
    v_slot_quantity INTEGER;
    v_completed_quantity INTEGER;
    v_unit_price NUMERIC;
    v_refund_amount NUMERIC;
    v_refundable_quantity INTEGER;
BEGIN
    -- 슬롯 정보 조회
    SELECT quantity, completed_quantity, unit_price
    INTO v_slot_quantity, v_completed_quantity, v_unit_price
    FROM per_unit_slots
    WHERE id = p_slot_id
    AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '슬롯을 찾을 수 없습니다.';
    END IF;
    
    -- 환불 가능 수량 계산
    v_refundable_quantity := v_slot_quantity - v_completed_quantity;
    
    IF p_refund_type = 'partial' THEN
        IF p_refund_quantity IS NULL OR p_refund_quantity <= 0 THEN
            RAISE EXCEPTION '환불 수량을 입력해주세요.';
        END IF;
        
        IF p_refund_quantity > v_refundable_quantity THEN
            RAISE EXCEPTION '환불 가능 수량(%건)을 초과했습니다.', v_refundable_quantity;
        END IF;
        
        v_refund_amount := p_refund_quantity * v_unit_price;
    ELSE -- full refund
        p_refund_quantity := v_refundable_quantity;
        v_refund_amount := v_refundable_quantity * v_unit_price;
    END IF;
    
    -- 환불 요청 생성
    INSERT INTO per_unit_refund_requests (
        slot_id, user_id, refund_type, refund_quantity,
        refund_amount, reason_category, reason_detail, evidence_urls
    ) VALUES (
        p_slot_id, auth.uid(), p_refund_type, p_refund_quantity,
        v_refund_amount, p_reason_category, p_reason_detail, p_evidence_urls
    ) RETURNING id INTO v_refund_id;
    
    RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. 트리거 함수
-- =====================================================

-- 슬롯 상태 변경 시 홀딩 금액 처리
CREATE OR REPLACE FUNCTION handle_slot_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 승인 시 작업 시작
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        NEW.actual_start_date := CURRENT_DATE;
        NEW.status := 'in_progress';
    END IF;
    
    -- 완료 시 최종 정산
    IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        -- 최종 정산 생성
        PERFORM create_per_unit_settlement(NEW.id);
    END IF;
    
    -- 취소/환불 시 홀딩 금액 반환
    IF NEW.status IN ('cancelled', 'refunded') AND OLD.status != NEW.status THEN
        UPDATE per_unit_holdings
        SET status = 'refunded'
        WHERE slot_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_slot_status_change
    BEFORE UPDATE OF status ON per_unit_slots
    FOR EACH ROW
    EXECUTE FUNCTION handle_slot_status_change();

-- 견적 요청 만료 처리
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS VOID AS $$
BEGIN
    UPDATE per_unit_slot_requests
    SET status = 'expired',
        expired_at = NOW()
    WHERE status IN ('requested', 'negotiating')
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. 뷰(View) 생성
-- =====================================================

-- 슬롯 상태 요약 뷰
CREATE OR REPLACE VIEW v_per_unit_slot_summary AS
SELECT 
    s.id as slot_id,
    s.user_id,
    s.distributor_id,
    c.campaign_name,
    s.quantity,
    s.unit_price,
    s.total_amount,
    s.completed_quantity,
    s.quantity - s.completed_quantity as remaining_quantity,
    ROUND((s.completed_quantity::NUMERIC / s.quantity) * 100, 2) as progress_rate,
    s.status,
    s.work_start_date,
    s.work_end_date,
    s.created_at
FROM per_unit_slots s
JOIN campaigns c ON c.id = s.campaign_id;

-- 일별 작업 실적 요약 뷰
CREATE OR REPLACE VIEW v_per_unit_daily_work AS
SELECT 
    wl.work_date,
    s.distributor_id,
    COUNT(DISTINCT s.id) as active_slots,
    SUM(wl.completed_count) as total_completed,
    SUM(wl.completed_count * s.unit_price) as total_amount
FROM per_unit_work_logs wl
JOIN per_unit_slots s ON s.id = wl.slot_id
WHERE wl.status = 'approved'
GROUP BY wl.work_date, s.distributor_id;

-- =====================================================
-- 10. 스케줄러 함수 (크론잡용)
-- =====================================================

-- 일일 정산 배치 함수
CREATE OR REPLACE FUNCTION daily_per_unit_settlement_batch()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_slot RECORD;
BEGIN
    -- 활성 슬롯 대상 정산 생성
    FOR v_slot IN 
        SELECT DISTINCT s.id
        FROM per_unit_slots s
        JOIN per_unit_work_logs wl ON wl.slot_id = s.id
        WHERE s.status = 'in_progress'
        AND wl.status = 'approved'
        AND wl.work_date = CURRENT_DATE - INTERVAL '1 day'
        AND NOT EXISTS (
            SELECT 1 FROM per_unit_settlements ps
            WHERE ps.slot_id = s.id
            AND ps.settlement_date = CURRENT_DATE - INTERVAL '1 day'
        )
    LOOP
        PERFORM create_per_unit_settlement(v_slot.id, CURRENT_DATE - INTERVAL '1 day');
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 완료 메시지
-- =====================================================
-- 단건형 캠페인 함수 및 트리거 생성이 완료되었습니다.
-- 다음 단계: 테스트 데이터 생성 (04_per_unit_test_data.sql)