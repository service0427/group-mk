-- =============================================================================
-- 보장성 슬롯 시스템 데이터베이스 스키마
-- 작성일: 2025-01-13
-- 설명: 기존 slots 테이블과 독립적으로 운영되는 보장성 슬롯 시스템
-- =============================================================================

-- 1. 보장성 슬롯 견적 요청 테이블
-- 사용자가 총판에게 보장성 슬롯 견적을 요청하는 내역 관리
CREATE TABLE IF NOT EXISTS public.guarantee_slot_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    distributor_id UUID REFERENCES auth.users(id),
    target_rank INTEGER NOT NULL CHECK (target_rank > 0),  -- 목표 순위 (예: 3위)
    guarantee_count INTEGER NOT NULL CHECK (guarantee_count > 0),  -- 보장 횟수 (예: 10회)
    initial_budget NUMERIC(10,2),  -- 희망 예산 (선택사항)
    status VARCHAR(30) NOT NULL DEFAULT 'requested',
    final_daily_amount NUMERIC(10,2),  -- 최종 협의된 회당 단가
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT request_status_check CHECK (status IN ('requested', 'negotiating', 'accepted', 'rejected', 'expired'))
);

-- 인덱스 생성
CREATE INDEX idx_guarantee_requests_user_id ON guarantee_slot_requests(user_id);
CREATE INDEX idx_guarantee_requests_distributor_id ON guarantee_slot_requests(distributor_id);
CREATE INDEX idx_guarantee_requests_status ON guarantee_slot_requests(status);
CREATE INDEX idx_guarantee_requests_campaign_id ON guarantee_slot_requests(campaign_id);

-- 2. 협상 메시지/메모 테이블
-- 사용자와 총판 간의 가격 협상 이력 관리
CREATE TABLE IF NOT EXISTS public.guarantee_slot_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES guarantee_slot_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_type VARCHAR(20) NOT NULL,  -- 'user' or 'distributor'
    message_type VARCHAR(20) NOT NULL,  -- 'message', 'price_proposal', 'counter_offer'
    message TEXT NOT NULL,
    proposed_daily_amount NUMERIC(10,2),  -- 제안 단가 (price_proposal인 경우)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT sender_type_check CHECK (sender_type IN ('user', 'distributor')),
    CONSTRAINT message_type_check CHECK (message_type IN ('message', 'price_proposal', 'counter_offer'))
);

-- 인덱스 생성
CREATE INDEX idx_negotiations_request_id ON guarantee_slot_negotiations(request_id);
CREATE INDEX idx_negotiations_created_at ON guarantee_slot_negotiations(created_at);
CREATE INDEX idx_negotiations_sender_id ON guarantee_slot_negotiations(sender_id);
CREATE INDEX idx_negotiations_is_read ON guarantee_slot_negotiations(is_read);

-- 3. 보장성 슬롯 메인 테이블
-- 실제 구매된 보장성 슬롯 정보 관리
CREATE TABLE IF NOT EXISTS public.guarantee_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES guarantee_slot_requests(id),  -- 견적 요청 연결
    user_id UUID NOT NULL REFERENCES auth.users(id),
    product_id INTEGER NOT NULL REFERENCES campaigns(id),
    distributor_id UUID NOT NULL REFERENCES auth.users(id),  -- 담당 총판
    target_rank INTEGER NOT NULL CHECK (target_rank > 0),  -- 목표 순위 (예: 3위)
    guarantee_count INTEGER NOT NULL CHECK (guarantee_count > 0),  -- 총 보장 횟수 (예: 10회)
    completed_count INTEGER DEFAULT 0 CHECK (completed_count >= 0),  -- 달성된 횟수
    daily_guarantee_amount NUMERIC(10,2) NOT NULL CHECK (daily_guarantee_amount > 0),  -- 회당 금액
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),  -- 총 금액
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    purchase_reason TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT guarantee_slots_status_check CHECK (status IN ('active', 'completed', 'cancelled')),
    CONSTRAINT completed_count_check CHECK (completed_count <= guarantee_count)
);

-- 인덱스 생성
CREATE INDEX idx_guarantee_slots_user_id ON guarantee_slots(user_id);
CREATE INDEX idx_guarantee_slots_distributor_id ON guarantee_slots(distributor_id);
CREATE INDEX idx_guarantee_slots_status ON guarantee_slots(status);
CREATE INDEX idx_guarantee_slots_product_id ON guarantee_slots(product_id);

-- 4. 보장성 슬롯 홀딩 금액 관리 테이블
-- 구매 금액의 홀딩 상태 관리 (사용자 → 시스템 → 총판)
CREATE TABLE IF NOT EXISTS public.guarantee_slot_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_slot_id UUID NOT NULL REFERENCES guarantee_slots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),  -- 총 홀딩 금액
    user_holding_amount NUMERIC(10,2) NOT NULL CHECK (user_holding_amount >= 0),  -- 사용자 홀딩 (아직 사용 안된 금액)
    distributor_holding_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (distributor_holding_amount >= 0),  -- 총판 홀딩 (작업 완료된 금액)
    distributor_released_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (distributor_released_amount >= 0),  -- 총판에게 실제 지급된 금액
    status VARCHAR(20) NOT NULL DEFAULT 'holding',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guarantee_slot_id),
    CONSTRAINT holding_status_check CHECK (status IN ('holding', 'partial_released', 'completed', 'refunded')),
    CONSTRAINT holding_amount_check CHECK (
        user_holding_amount + distributor_holding_amount + distributor_released_amount = total_amount
    )
);

-- 인덱스 생성
CREATE INDEX idx_guarantee_slot_holdings_status ON guarantee_slot_holdings(status);
CREATE INDEX idx_guarantee_slot_holdings_user_id ON guarantee_slot_holdings(user_id);

-- 5. 보장성 슬롯 정산 내역 테이블
-- 일별 순위 달성 확인 및 정산 내역
CREATE TABLE IF NOT EXISTS public.guarantee_slot_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_slot_id UUID NOT NULL REFERENCES guarantee_slots(id) ON DELETE CASCADE,
    confirmed_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- 보장 확인 날짜
    confirmed_by UUID NOT NULL REFERENCES auth.users(id),  -- 확인한 총판
    target_rank INTEGER NOT NULL CHECK (target_rank > 0),  -- 목표 순위
    achieved_rank INTEGER NOT NULL CHECK (achieved_rank > 0),  -- 실제 달성 순위
    is_guaranteed BOOLEAN NOT NULL,  -- 보장 성공 여부
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),  -- 정산 금액
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_guarantee_settlements_date ON guarantee_slot_settlements(confirmed_date);
CREATE INDEX idx_guarantee_settlements_slot_id ON guarantee_slot_settlements(guarantee_slot_id);
CREATE INDEX idx_guarantee_settlements_confirmed_by ON guarantee_slot_settlements(confirmed_by);

-- 같은 슬롯의 같은 날짜에 중복 확인 방지
CREATE UNIQUE INDEX idx_guarantee_settlements_unique ON guarantee_slot_settlements(guarantee_slot_id, confirmed_date);

-- 6. 보장성 슬롯 거래 내역 테이블
-- 모든 금액 변동 내역 추적
CREATE TABLE IF NOT EXISTS public.guarantee_slot_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_slot_id UUID NOT NULL REFERENCES guarantee_slots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    balance_before NUMERIC(10,2),
    balance_after NUMERIC(10,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transaction_type_check CHECK (transaction_type IN ('purchase', 'settlement', 'refund', 'cancellation'))
);

-- 인덱스 생성
CREATE INDEX idx_guarantee_transactions_user ON guarantee_slot_transactions(user_id);
CREATE INDEX idx_guarantee_transactions_type ON guarantee_slot_transactions(transaction_type);
CREATE INDEX idx_guarantee_transactions_slot_id ON guarantee_slot_transactions(guarantee_slot_id);
CREATE INDEX idx_guarantee_transactions_created_at ON guarantee_slot_transactions(created_at);

-- =============================================================================
-- 트리거 함수들
-- =============================================================================

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_guarantee_slot_requests_updated_at
    BEFORE UPDATE ON guarantee_slot_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guarantee_slots_updated_at
    BEFORE UPDATE ON guarantee_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guarantee_slot_holdings_updated_at
    BEFORE UPDATE ON guarantee_slot_holdings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 뷰(Views) 생성
-- =============================================================================

-- 보장성 슬롯 현황 뷰
CREATE OR REPLACE VIEW guarantee_slots_status_view AS
SELECT 
    gs.id,
    gs.user_id,
    u.email as user_email,
    u.full_name as user_name,
    gs.distributor_id,
    d.email as distributor_email,
    d.full_name as distributor_name,
    gs.product_id,
    c.campaign_name,
    c.service_type,
    gs.target_rank,
    gs.guarantee_count,
    gs.completed_count,
    gs.daily_guarantee_amount,
    gs.total_amount,
    gs.status,
    gsh.user_holding_amount,
    gsh.distributor_holding_amount,
    gsh.distributor_released_amount,
    gs.created_at,
    gs.updated_at
FROM guarantee_slots gs
LEFT JOIN users u ON gs.user_id = u.id
LEFT JOIN users d ON gs.distributor_id = d.id
LEFT JOIN campaigns c ON gs.product_id = c.id
LEFT JOIN guarantee_slot_holdings gsh ON gs.id = gsh.guarantee_slot_id;

-- 일별 정산 대상 뷰
CREATE OR REPLACE VIEW daily_guarantee_check_view AS
SELECT 
    gs.id as slot_id,
    gs.user_id,
    gs.distributor_id,
    gs.product_id,
    c.campaign_name,
    gs.target_rank,
    gs.guarantee_count,
    gs.completed_count,
    gs.daily_guarantee_amount,
    CURRENT_DATE as check_date,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM guarantee_slot_settlements gss 
            WHERE gss.guarantee_slot_id = gs.id 
            AND gss.confirmed_date = CURRENT_DATE
        ) THEN TRUE 
        ELSE FALSE 
    END as already_checked_today
FROM guarantee_slots gs
JOIN campaigns c ON gs.product_id = c.id
WHERE gs.status = 'active'
AND gs.completed_count < gs.guarantee_count;

-- =============================================================================
-- 테이블 코멘트
-- =============================================================================

COMMENT ON TABLE guarantee_slot_requests IS '보장성 슬롯 견적 요청 테이블';
COMMENT ON TABLE guarantee_slot_negotiations IS '보장성 슬롯 협상 메시지 테이블';
COMMENT ON TABLE guarantee_slots IS '보장성 슬롯 메인 테이블';
COMMENT ON TABLE guarantee_slot_holdings IS '보장성 슬롯 홀딩 금액 관리 테이블';
COMMENT ON TABLE guarantee_slot_settlements IS '보장성 슬롯 정산 내역 테이블';
COMMENT ON TABLE guarantee_slot_transactions IS '보장성 슬롯 거래 내역 테이블';

-- 컬럼 코멘트
COMMENT ON COLUMN guarantee_slots.target_rank IS '목표 순위 (예: 3위를 보장)';
COMMENT ON COLUMN guarantee_slots.guarantee_count IS '총 보장 횟수 (예: 10회 보장)';
COMMENT ON COLUMN guarantee_slots.completed_count IS '현재까지 달성된 횟수';
COMMENT ON COLUMN guarantee_slots.daily_guarantee_amount IS '회당 정산 금액';

COMMENT ON COLUMN guarantee_slot_holdings.user_holding_amount IS '사용자 홀딩 잔액 (아직 사용되지 않은 금액)';
COMMENT ON COLUMN guarantee_slot_holdings.distributor_holding_amount IS '총판 홀딩 잔액 (작업 완료되었으나 아직 지급되지 않은 금액)';
COMMENT ON COLUMN guarantee_slot_holdings.distributor_released_amount IS '총판에게 실제 지급된 금액';