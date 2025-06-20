-- =============================================================================
-- 보장형 캠페인 시스템 통합 스키마
-- 작성일: 2025-06-18
-- 설명: 보장형 캠페인 시스템의 모든 테이블 및 기본 구조 정의
-- =============================================================================

-- 1. campaigns 테이블 확장 (보장형 관련 컬럼)
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_guarantee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guarantee_count INTEGER,
ADD COLUMN IF NOT EXISTS target_rank INTEGER,
ADD COLUMN IF NOT EXISTS min_guarantee_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS max_guarantee_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS guarantee_unit VARCHAR(10) DEFAULT '일';

-- campaigns 테이블 제약 조건 추가
ALTER TABLE public.campaigns
ADD CONSTRAINT IF NOT EXISTS slot_type_check CHECK (slot_type IN ('standard', 'guarantee')),
ADD CONSTRAINT IF NOT EXISTS guarantee_count_check CHECK (
    (slot_type = 'guarantee' AND guarantee_count IS NOT NULL AND guarantee_count > 0) OR
    (slot_type = 'standard' AND guarantee_count IS NULL)
),
ADD CONSTRAINT IF NOT EXISTS target_rank_check CHECK (
    (slot_type = 'guarantee' AND target_rank IS NOT NULL AND target_rank > 0) OR
    (slot_type = 'standard' AND target_rank IS NULL)
),
ADD CONSTRAINT IF NOT EXISTS guarantee_price_check CHECK (
    (is_negotiable = TRUE AND min_guarantee_price IS NOT NULL AND max_guarantee_price IS NOT NULL AND min_guarantee_price <= max_guarantee_price) OR
    (is_negotiable = FALSE)
),
ADD CONSTRAINT IF NOT EXISTS guarantee_unit_check CHECK (
    guarantee_unit IN ('일', '회') OR guarantee_unit IS NULL
);

-- campaigns 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_slot_type ON campaigns(slot_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_guarantee ON campaigns(is_guarantee);
CREATE INDEX IF NOT EXISTS idx_campaigns_guarantee_unit ON campaigns(guarantee_unit) 
WHERE slot_type = 'guarantee';

-- campaigns 테이블 컬럼 코멘트
COMMENT ON COLUMN campaigns.slot_type IS '슬롯 유형 (standard: 일반, guarantee: 보장성)';
COMMENT ON COLUMN campaigns.is_guarantee IS '보장성 슬롯 여부';
COMMENT ON COLUMN campaigns.is_negotiable IS '가격 협상 가능 여부 (보장성 슬롯)';
COMMENT ON COLUMN campaigns.guarantee_count IS '보장 횟수 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.target_rank IS '목표 순위 (보장성 슬롯인 경우)';
COMMENT ON COLUMN campaigns.min_guarantee_price IS '최소 보장 가격 (회당)';
COMMENT ON COLUMN campaigns.max_guarantee_price IS '최대 보장 가격 (회당)';
COMMENT ON COLUMN campaigns.guarantee_unit IS '보장 단위 (일: 기간 기준, 회: 횟수 기준)';

-- 2. 보장성 슬롯 견적 요청 테이블
CREATE TABLE IF NOT EXISTS public.guarantee_slot_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    distributor_id UUID REFERENCES auth.users(id),
    target_rank INTEGER NOT NULL CHECK (target_rank > 0),
    guarantee_count INTEGER NOT NULL CHECK (guarantee_count > 0),
    initial_budget NUMERIC(10,2),
    status VARCHAR(30) NOT NULL DEFAULT 'requested',
    final_daily_amount NUMERIC(10,2),
    keyword_id INTEGER REFERENCES keywords(id),
    input_data JSONB,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT request_status_check CHECK (status IN ('requested', 'negotiating', 'accepted', 'rejected', 'expired', 'purchased'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_user_id ON guarantee_slot_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_distributor_id ON guarantee_slot_requests(distributor_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_status ON guarantee_slot_requests(status);
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_campaign_id ON guarantee_slot_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_keyword_id ON guarantee_slot_requests(keyword_id);

-- 3. 협상 메시지/메모 테이블
CREATE TABLE IF NOT EXISTS public.guarantee_slot_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES guarantee_slot_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_role VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    proposed_daily_amount NUMERIC(10,2),
    proposed_guarantee_count INTEGER,
    attachments JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT sender_role_check CHECK (sender_role IN ('user', 'distributor', 'admin')),
    CONSTRAINT message_type_check CHECK (message_type IN ('message', 'price_proposal', 'counter_offer', 'acceptance'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_negotiations_request_id ON guarantee_slot_negotiations(request_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON guarantee_slot_negotiations(created_at);
CREATE INDEX IF NOT EXISTS idx_negotiations_sender_id ON guarantee_slot_negotiations(sender_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_is_read ON guarantee_slot_negotiations(is_read);

-- 4. 보장성 슬롯 메인 테이블
CREATE TABLE IF NOT EXISTS public.guarantee_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES guarantee_slot_requests(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    product_id INTEGER NOT NULL REFERENCES campaigns(id),
    distributor_id UUID NOT NULL REFERENCES auth.users(id),
    target_rank INTEGER NOT NULL CHECK (target_rank > 0),
    guarantee_count INTEGER NOT NULL CHECK (guarantee_count > 0),
    completed_count INTEGER DEFAULT 0 CHECK (completed_count >= 0),
    daily_guarantee_amount NUMERIC(10,2) NOT NULL CHECK (daily_guarantee_amount > 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
    guarantee_unit VARCHAR(10) DEFAULT 'daily',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    purchase_reason TEXT,
    cancellation_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT guarantee_slots_status_check CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'rejected')),
    CONSTRAINT completed_count_check CHECK (completed_count <= guarantee_count),
    CONSTRAINT guarantee_unit_check CHECK (guarantee_unit IN ('daily', 'count'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_user_id ON guarantee_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_distributor_id ON guarantee_slots(distributor_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_status ON guarantee_slots(status);
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_product_id ON guarantee_slots(product_id);

-- 5. 보장성 슬롯 홀딩 금액 관리 테이블
CREATE TABLE IF NOT EXISTS public.guarantee_slot_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_slot_id UUID NOT NULL REFERENCES guarantee_slots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    user_holding_amount NUMERIC(10,2) NOT NULL CHECK (user_holding_amount >= 0),
    distributor_holding_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (distributor_holding_amount >= 0),
    distributor_released_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (distributor_released_amount >= 0),
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
CREATE INDEX IF NOT EXISTS idx_guarantee_slot_holdings_status ON guarantee_slot_holdings(status);
CREATE INDEX IF NOT EXISTS idx_guarantee_slot_holdings_user_id ON guarantee_slot_holdings(user_id);

-- 6. 보장성 슬롯 정산 내역 테이블
CREATE TABLE IF NOT EXISTS public.guarantee_slot_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_slot_id UUID NOT NULL REFERENCES guarantee_slots(id) ON DELETE CASCADE,
    confirmed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    confirmed_by UUID NOT NULL REFERENCES auth.users(id),
    target_rank INTEGER NOT NULL CHECK (target_rank > 0),
    achieved_rank INTEGER NOT NULL CHECK (achieved_rank > 0),
    is_guaranteed BOOLEAN NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    work_memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guarantee_settlements_date ON guarantee_slot_settlements(confirmed_date);
CREATE INDEX IF NOT EXISTS idx_guarantee_settlements_slot_id ON guarantee_slot_settlements(guarantee_slot_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_settlements_confirmed_by ON guarantee_slot_settlements(confirmed_by);

-- 같은 슬롯의 같은 날짜에 중복 확인 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_guarantee_settlements_unique ON guarantee_slot_settlements(guarantee_slot_id, confirmed_date);

-- 7. 보장성 슬롯 거래 내역 테이블
CREATE TABLE IF NOT EXISTS public.guarantee_slot_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarantee_slot_id UUID NOT NULL REFERENCES guarantee_slots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    balance_before NUMERIC(10,2),
    balance_after NUMERIC(10,2),
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transaction_type_check CHECK (transaction_type IN ('purchase', 'settlement', 'refund', 'cancellation', 'approval', 'rejection', 'completion'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guarantee_transactions_user ON guarantee_slot_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_transactions_type ON guarantee_slot_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_guarantee_transactions_slot_id ON guarantee_slot_transactions(guarantee_slot_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_transactions_created_at ON guarantee_slot_transactions(created_at);

-- 8. 보장형 엑셀 템플릿 테이블
CREATE TABLE IF NOT EXISTS guarantee_excel_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    columns JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guarantee_excel_templates_user_id ON guarantee_excel_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_excel_templates_created_at ON guarantee_excel_templates(created_at);

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
CREATE TRIGGER IF NOT EXISTS update_guarantee_slot_requests_updated_at
    BEFORE UPDATE ON guarantee_slot_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_guarantee_slots_updated_at
    BEFORE UPDATE ON guarantee_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_guarantee_slot_holdings_updated_at
    BEFORE UPDATE ON guarantee_slot_holdings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_guarantee_excel_templates_updated_at_trigger
    BEFORE UPDATE ON guarantee_excel_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 테이블 코멘트
-- =============================================================================

COMMENT ON TABLE guarantee_slot_requests IS '보장성 슬롯 견적 요청 테이블';
COMMENT ON COLUMN guarantee_slot_requests.status IS 'requested: 요청됨, negotiating: 협상중, accepted: 협상완료, rejected: 거절됨, expired: 만료됨, purchased: 구매완료';

COMMENT ON TABLE guarantee_slot_negotiations IS '보장성 슬롯 협상 메시지 테이블';

COMMENT ON TABLE guarantee_slots IS '보장성 슬롯 메인 테이블';
COMMENT ON COLUMN guarantee_slots.target_rank IS '목표 순위 (예: 3위를 보장)';
COMMENT ON COLUMN guarantee_slots.guarantee_count IS '총 보장 횟수 (예: 10회 보장)';
COMMENT ON COLUMN guarantee_slots.completed_count IS '현재까지 달성된 횟수';
COMMENT ON COLUMN guarantee_slots.daily_guarantee_amount IS '회당 정산 금액';
COMMENT ON COLUMN guarantee_slots.approved_at IS '총판이 승인한 시각';
COMMENT ON COLUMN guarantee_slots.approved_by IS '승인한 총판 ID';
COMMENT ON COLUMN guarantee_slots.rejected_at IS '총판이 반려한 시각';
COMMENT ON COLUMN guarantee_slots.rejected_by IS '반려한 총판 ID';
COMMENT ON COLUMN guarantee_slots.rejection_reason IS '반려 사유';

COMMENT ON TABLE guarantee_slot_holdings IS '보장성 슬롯 홀딩 금액 관리 테이블';
COMMENT ON COLUMN guarantee_slot_holdings.user_holding_amount IS '사용자 홀딩 잔액 (아직 사용되지 않은 금액)';
COMMENT ON COLUMN guarantee_slot_holdings.distributor_holding_amount IS '총판 홀딩 잔액 (작업 완료되었으나 아직 지급되지 않은 금액)';
COMMENT ON COLUMN guarantee_slot_holdings.distributor_released_amount IS '총판에게 실제 지급된 금액';

COMMENT ON TABLE guarantee_slot_settlements IS '보장성 슬롯 정산 내역 테이블';

COMMENT ON TABLE guarantee_slot_transactions IS '보장성 슬롯 거래 내역 테이블';

COMMENT ON TABLE guarantee_excel_templates IS '보장형 슬롯 엑셀 템플릿 테이블';