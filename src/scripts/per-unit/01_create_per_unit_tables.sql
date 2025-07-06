-- =====================================================
-- 단건형(Per-Unit) 캠페인 테이블 생성 스크립트
-- =====================================================
-- 설명: 건별 단가 기반의 캠페인 서비스를 위한 테이블 구조
-- 작성일: 2025-07-06
-- =====================================================

-- 1. 캠페인 테이블에 단건형 타입 추가를 위한 수정
-- (기존 campaigns 테이블이 있다고 가정)
DO $$
BEGIN
    -- slot_type 컬럼에 'per-unit' 값을 추가할 수 있도록 CHECK 제약조건 수정
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'slot_type'
    ) THEN
        ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_slot_type_check;
        ALTER TABLE campaigns ADD CONSTRAINT campaigns_slot_type_check 
            CHECK (slot_type IN ('standard', 'guarantee', 'per-unit'));
    END IF;
END $$;

-- 2. 단건형 캠페인 상세 정보 테이블
CREATE TABLE IF NOT EXISTS per_unit_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- 기본 설정
    min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),           -- 최소 구매 수량
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),        -- 건당 단가
    max_quantity INTEGER CHECK (max_quantity IS NULL OR max_quantity > min_quantity), -- 최대 구매 수량 (선택)
    
    -- 작업 관련
    work_period INTEGER NOT NULL CHECK (work_period > 0),             -- 작업 기간 (일)
    work_start_hour INTEGER DEFAULT 9 CHECK (work_start_hour >= 0 AND work_start_hour < 24), -- 작업 시작 시간
    work_end_hour INTEGER DEFAULT 18 CHECK (work_end_hour > work_start_hour AND work_end_hour <= 24), -- 작업 종료 시간
    
    -- 협상 관련
    is_negotiable BOOLEAN DEFAULT FALSE,                              -- 가격 협상 가능 여부
    min_unit_price NUMERIC(10,2) CHECK (min_unit_price IS NULL OR min_unit_price > 0), -- 최소 협상 단가
    max_unit_price NUMERIC(10,2) CHECK (max_unit_price IS NULL OR max_unit_price > min_unit_price), -- 최대 협상 단가
    
    -- 추가 정보
    description TEXT,                                                 -- 상세 설명
    requirements JSONB DEFAULT '{}',                                  -- 요구사항 (JSON 형태)
    sample_urls JSONB DEFAULT '[]',                                   -- 샘플 URL 목록
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- 제약조건
    CONSTRAINT per_unit_campaigns_campaign_unique UNIQUE (campaign_id),
    CONSTRAINT per_unit_campaigns_negotiable_prices_check 
        CHECK (
            (is_negotiable = FALSE) OR 
            (is_negotiable = TRUE AND min_unit_price IS NOT NULL AND max_unit_price IS NOT NULL)
        )
);

-- 3. 단건형 슬롯 견적 요청 테이블
CREATE TABLE IF NOT EXISTS per_unit_slot_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    user_id UUID NOT NULL REFERENCES users(id),
    distributor_id UUID NOT NULL REFERENCES users(id),
    
    -- 요청 내용
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0), -- 요청 수량
    requested_unit_price NUMERIC(10,2),                                -- 희망 단가
    suggested_unit_price NUMERIC(10,2),                                -- 총판 제안 단가
    final_unit_price NUMERIC(10,2),                                    -- 최종 확정 단가
    
    -- 작업 일정
    preferred_start_date DATE,                                         -- 희망 시작일
    work_period INTEGER,                                               -- 작업 기간
    
    -- 상태 관리
    status VARCHAR(50) NOT NULL DEFAULT 'requested' 
        CHECK (status IN ('requested', 'negotiating', 'accepted', 'rejected', 'expired', 'purchased', 'cancelled')),
    
    -- 메시지
    request_message TEXT,                                              -- 요청 메시지
    reject_reason TEXT,                                                -- 거절 사유
    
    -- 메타데이터
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 단건형 협상 메시지 테이블
CREATE TABLE IF NOT EXISTS per_unit_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES per_unit_slot_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('user', 'distributor', 'operator')),
    
    -- 메시지 내용
    message_type VARCHAR(50) NOT NULL DEFAULT 'message' 
        CHECK (message_type IN ('message', 'price_proposal', 'counter_offer', 'acceptance', 'rejection')),
    message TEXT NOT NULL,
    
    -- 가격 제안 (message_type이 price_proposal, counter_offer일 때)
    proposed_unit_price NUMERIC(10,2),
    proposed_quantity INTEGER,
    
    -- 첨부파일
    attachment_urls JSONB DEFAULT '[]',
    
    -- 메타데이터
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 단건형 슬롯 (구매 확정) 테이블
-- 테이블이 이미 존재할 경우를 대비하여 제약조건 먼저 삭제
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'per_unit_slots') THEN
        ALTER TABLE per_unit_slots DROP CONSTRAINT IF EXISTS per_unit_slots_quantity_check CASCADE;
        ALTER TABLE per_unit_slots DROP CONSTRAINT IF EXISTS per_unit_slots_dates_check CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS per_unit_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    request_id UUID REFERENCES per_unit_slot_requests(id),
    user_id UUID NOT NULL REFERENCES users(id),
    distributor_id UUID NOT NULL REFERENCES users(id),
    
    -- 구매 정보
    quantity INTEGER NOT NULL CHECK (quantity > 0),                    -- 구매 수량
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),         -- 건당 단가
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),     -- 총 금액
    vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,                      -- VAT 금액
    
    -- 진행 상황
    completed_quantity INTEGER DEFAULT 0 CHECK (completed_quantity >= 0), -- 완료된 수량
    cancelled_quantity INTEGER DEFAULT 0 CHECK (cancelled_quantity >= 0), -- 취소된 수량
    
    -- 작업 일정
    work_start_date DATE,                                              -- 작업 시작일
    work_end_date DATE,                                                -- 작업 종료일
    actual_start_date DATE,                                            -- 실제 시작일
    actual_end_date DATE,                                              -- 실제 종료일
    
    -- 상태 관리
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled', 'partial_refunded', 'refunded')),
    
    -- 승인 정보
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    reject_reason TEXT,
    
    -- 추가 정보
    input_data JSONB DEFAULT '{}',                                     -- 사용자 입력 데이터
    notes TEXT,                                                        -- 비고
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건 (타임스탬프를 포함하여 유니크하게)
    CONSTRAINT per_unit_slots_qty_chk_v1 
        CHECK (completed_quantity + cancelled_quantity <= quantity),
    CONSTRAINT per_unit_slots_dates_chk_v1 
        CHECK (work_end_date IS NULL OR work_start_date <= work_end_date)
);

-- 6. 단건형 작업 실적 테이블
CREATE TABLE IF NOT EXISTS per_unit_work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES per_unit_slots(id) ON DELETE CASCADE,
    
    -- 작업 정보
    work_date DATE NOT NULL,                                           -- 작업일
    completed_count INTEGER NOT NULL CHECK (completed_count >= 0),     -- 완료 건수
    
    -- 작업 증빙
    work_urls JSONB DEFAULT '[]',                                      -- 작업 URL 목록
    screenshot_urls JSONB DEFAULT '[]',                                -- 스크린샷 URL 목록
    
    -- 검증 정보
    notes TEXT,                                                        -- 작업 메모
    verification_notes TEXT,                                           -- 검증 메모
    
    -- 상태 관리
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    
    -- 승인 정보
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT per_unit_work_logs_unique_date UNIQUE (slot_id, work_date)
);

-- 7. 단건형 홀딩 금액 테이블
CREATE TABLE IF NOT EXISTS per_unit_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES per_unit_slots(id) ON DELETE CASCADE,
    
    -- 홀딩 금액
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),    -- 총 홀딩 금액
    user_holding_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (user_holding_amount >= 0), -- 사용자 홀딩 잔액
    distributor_holding_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (distributor_holding_amount >= 0), -- 총판 홀딩 잔액
    
    -- 릴리즈 금액
    user_released_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (user_released_amount >= 0), -- 사용자 지급 완료 금액
    distributor_released_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (distributor_released_amount >= 0), -- 총판 지급 완료 금액
    
    -- 상태
    status VARCHAR(50) NOT NULL DEFAULT 'holding'
        CHECK (status IN ('holding', 'partial_released', 'completed', 'refunded')),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT per_unit_holdings_slot_unique UNIQUE (slot_id),
    CONSTRAINT per_unit_holdings_amount_check 
        CHECK (
            user_holding_amount + distributor_holding_amount + 
            user_released_amount + distributor_released_amount = total_amount
        )
);

-- 8. 단건형 1:1 문의 테이블
CREATE TABLE IF NOT EXISTS per_unit_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES per_unit_slots(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- 문의 내용
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (category IN ('general', 'work', 'refund', 'payment', 'other')),
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- 상태 관리
    status VARCHAR(50) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
    
    -- 담당자
    assigned_to UUID REFERENCES users(id),
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 9. 단건형 문의 메시지 테이블
CREATE TABLE IF NOT EXISTS per_unit_inquiry_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES per_unit_inquiries(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    -- 메시지 내용
    message TEXT NOT NULL,
    attachment_urls JSONB DEFAULT '[]',
    
    -- 메시지 유형
    is_internal_note BOOLEAN DEFAULT FALSE,                            -- 내부 메모 여부
    is_system_message BOOLEAN DEFAULT FALSE,                           -- 시스템 메시지 여부
    
    -- 메타데이터
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 단건형 환불 요청 테이블
CREATE TABLE IF NOT EXISTS per_unit_refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES per_unit_slots(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- 환불 정보
    refund_type VARCHAR(50) NOT NULL 
        CHECK (refund_type IN ('partial', 'full', 'penalty')),        -- 부분/전체/위약금
    refund_quantity INTEGER CHECK (refund_quantity > 0),              -- 환불 요청 수량
    refund_amount NUMERIC(10,2) NOT NULL CHECK (refund_amount > 0),   -- 환불 금액
    penalty_amount NUMERIC(10,2) DEFAULT 0 CHECK (penalty_amount >= 0), -- 위약금
    
    -- 환불 사유
    reason_category VARCHAR(50) NOT NULL
        CHECK (reason_category IN ('not_started', 'quality_issue', 'delayed', 'change_mind', 'other')),
    reason_detail TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]',                                  -- 증빙 자료
    
    -- 처리 정보
    status VARCHAR(50) NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'reviewing', 'approved', 'rejected', 'completed', 'cancelled')),
    admin_notes TEXT,                                                  -- 관리자 메모
    reject_reason TEXT,                                                -- 거절 사유
    
    -- 처리자 정보
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    -- 메타데이터
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 단건형 정산 테이블
CREATE TABLE IF NOT EXISTS per_unit_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES per_unit_slots(id),
    
    -- 정산 정보
    settlement_date DATE NOT NULL,                                     -- 정산일
    settlement_type VARCHAR(50) NOT NULL DEFAULT 'daily'
        CHECK (settlement_type IN ('daily', 'weekly', 'monthly', 'final')),
    
    -- 정산 내역
    total_completed INTEGER NOT NULL CHECK (total_completed >= 0),     -- 총 완료 건수
    settlement_amount NUMERIC(12,2) NOT NULL CHECK (settlement_amount >= 0), -- 정산 금액
    
    -- 수수료 및 분배
    platform_fee_rate NUMERIC(5,2) DEFAULT 10.0,                      -- 플랫폼 수수료율 (%)
    platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,                    -- 플랫폼 수수료
    distributor_amount NUMERIC(10,2) NOT NULL DEFAULT 0,              -- 총판 수익
    
    -- 상태 관리
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
    
    -- 처리 정보
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES users(id),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT per_unit_settlements_amount_check 
        CHECK (settlement_amount = distributor_amount + platform_fee)
);

-- 12. 단건형 거래 내역 테이블
CREATE TABLE IF NOT EXISTS per_unit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES per_unit_slots(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- 거래 정보
    transaction_type VARCHAR(50) NOT NULL
        CHECK (transaction_type IN ('purchase', 'settlement', 'refund', 'penalty', 'cancellation')),
    amount NUMERIC(12,2) NOT NULL,                                     -- 거래 금액 (양수: 입금, 음수: 출금)
    
    -- 잔액 정보
    balance_before NUMERIC(12,2),                                      -- 거래 전 잔액
    balance_after NUMERIC(12,2),                                       -- 거래 후 잔액
    
    -- 관련 정보
    related_table VARCHAR(50),                                         -- 관련 테이블명
    related_id UUID,                                                   -- 관련 레코드 ID
    
    -- 설명
    description TEXT,
    
    -- 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 캠페인 관련 인덱스
CREATE INDEX idx_per_unit_campaigns_campaign_id ON per_unit_campaigns(campaign_id);
CREATE INDEX idx_per_unit_campaigns_created_at ON per_unit_campaigns(created_at);

-- 견적 요청 인덱스
CREATE INDEX idx_per_unit_slot_requests_campaign_id ON per_unit_slot_requests(campaign_id);
CREATE INDEX idx_per_unit_slot_requests_user_id ON per_unit_slot_requests(user_id);
CREATE INDEX idx_per_unit_slot_requests_distributor_id ON per_unit_slot_requests(distributor_id);
CREATE INDEX idx_per_unit_slot_requests_status ON per_unit_slot_requests(status);
CREATE INDEX idx_per_unit_slot_requests_created_at ON per_unit_slot_requests(created_at);

-- 협상 메시지 인덱스
CREATE INDEX idx_per_unit_negotiations_request_id ON per_unit_negotiations(request_id);
CREATE INDEX idx_per_unit_negotiations_sender_id ON per_unit_negotiations(sender_id);
CREATE INDEX idx_per_unit_negotiations_created_at ON per_unit_negotiations(created_at);

-- 슬롯 인덱스
CREATE INDEX idx_per_unit_slots_campaign_id ON per_unit_slots(campaign_id);
CREATE INDEX idx_per_unit_slots_user_id ON per_unit_slots(user_id);
CREATE INDEX idx_per_unit_slots_distributor_id ON per_unit_slots(distributor_id);
CREATE INDEX idx_per_unit_slots_status ON per_unit_slots(status);
CREATE INDEX idx_per_unit_slots_work_dates ON per_unit_slots(work_start_date, work_end_date);
CREATE INDEX idx_per_unit_slots_created_at ON per_unit_slots(created_at);

-- 작업 실적 인덱스
CREATE INDEX idx_per_unit_work_logs_slot_id ON per_unit_work_logs(slot_id);
CREATE INDEX idx_per_unit_work_logs_work_date ON per_unit_work_logs(work_date);
CREATE INDEX idx_per_unit_work_logs_status ON per_unit_work_logs(status);

-- 문의 인덱스
CREATE INDEX idx_per_unit_inquiries_slot_id ON per_unit_inquiries(slot_id);
CREATE INDEX idx_per_unit_inquiries_user_id ON per_unit_inquiries(user_id);
CREATE INDEX idx_per_unit_inquiries_status ON per_unit_inquiries(status);
CREATE INDEX idx_per_unit_inquiries_created_at ON per_unit_inquiries(created_at);

-- 환불 요청 인덱스
CREATE INDEX idx_per_unit_refund_requests_slot_id ON per_unit_refund_requests(slot_id);
CREATE INDEX idx_per_unit_refund_requests_user_id ON per_unit_refund_requests(user_id);
CREATE INDEX idx_per_unit_refund_requests_status ON per_unit_refund_requests(status);
CREATE INDEX idx_per_unit_refund_requests_created_at ON per_unit_refund_requests(created_at);

-- 정산 인덱스
CREATE INDEX idx_per_unit_settlements_slot_id ON per_unit_settlements(slot_id);
CREATE INDEX idx_per_unit_settlements_settlement_date ON per_unit_settlements(settlement_date);
CREATE INDEX idx_per_unit_settlements_status ON per_unit_settlements(status);

-- 거래 내역 인덱스
CREATE INDEX idx_per_unit_transactions_slot_id ON per_unit_transactions(slot_id);
CREATE INDEX idx_per_unit_transactions_user_id ON per_unit_transactions(user_id);
CREATE INDEX idx_per_unit_transactions_type ON per_unit_transactions(transaction_type);
CREATE INDEX idx_per_unit_transactions_created_at ON per_unit_transactions(created_at);

-- =====================================================
-- 트리거 함수 생성
-- =====================================================

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_per_unit_campaigns_updated_at BEFORE UPDATE ON per_unit_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_per_unit_slot_requests_updated_at BEFORE UPDATE ON per_unit_slot_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_per_unit_slots_updated_at BEFORE UPDATE ON per_unit_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_per_unit_work_logs_updated_at BEFORE UPDATE ON per_unit_work_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_per_unit_inquiries_updated_at BEFORE UPDATE ON per_unit_inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_per_unit_refund_requests_updated_at BEFORE UPDATE ON per_unit_refund_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_per_unit_settlements_updated_at BEFORE UPDATE ON per_unit_settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- 각 테이블에 RLS 활성화
ALTER TABLE per_unit_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_slot_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_inquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_unit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책은 별도 파일(02_per_unit_rls_policies.sql)에서 정의

-- =====================================================
-- 초기 데이터 및 설정
-- =====================================================

-- 시스템 설정 테이블에 단건형 관련 설정 추가 (선택사항)
-- INSERT INTO system_settings (key, value, description) VALUES
-- ('per_unit.default_min_quantity', '300', '단건형 캠페인 기본 최소 수량'),
-- ('per_unit.default_work_period', '30', '단건형 캠페인 기본 작업 기간(일)'),
-- ('per_unit.platform_fee_rate', '10', '단건형 캠페인 플랫폼 수수료율(%)');

-- =====================================================
-- 완료 메시지
-- =====================================================
-- 단건형 캠페인 테이블 생성이 완료되었습니다.
-- 다음 단계: RLS 정책 적용 (02_per_unit_rls_policies.sql)
