-- =============================================================================
-- 1:1 문의 시스템 스키마
-- 작성일: 2025-01-20
-- 설명: 1:1 문의 채팅 시스템의 데이터베이스 스키마
-- =============================================================================

-- 1. 1:1 문의 메인 테이블
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    distributor_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT inquiry_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_distributor_id ON inquiries(distributor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_slot_id ON inquiries(slot_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_campaign_id ON inquiries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

-- 2. 1:1 문의 메시지 테이블
CREATE TABLE IF NOT EXISTS public.inquiry_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT sender_role_check CHECK (sender_role IN ('user', 'distributor', 'admin'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_sender_id ON inquiry_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_created_at ON inquiry_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_is_read ON inquiry_messages(is_read);

-- 3. 문의 카테고리 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS public.inquiry_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 카테고리 삽입
INSERT INTO inquiry_categories (name, description) VALUES
    ('일반문의', '일반적인 문의사항'),
    ('기술지원', '기술적인 문제나 오류 관련'),
    ('결제문의', '결제 및 환불 관련 문의'),
    ('계정문의', '계정 관리 관련 문의'),
    ('기타', '기타 문의사항')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 트리거 함수들
-- =============================================================================

-- updated_at 자동 업데이트 트리거 함수 (이미 존재할 수 있으므로 CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 문의 상태 변경 시 resolved_at 자동 설정
CREATE OR REPLACE FUNCTION update_inquiry_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    ELSIF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inquiry_resolved_at ON inquiries;
CREATE TRIGGER update_inquiry_resolved_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_inquiry_resolved_at();

-- =============================================================================
-- RLS (Row Level Security) 정책
-- =============================================================================

-- inquiries 테이블 RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 문의만 볼 수 있음
CREATE POLICY inquiries_select_policy ON inquiries
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.uid() = distributor_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'developer', 'operator')
        )
    );

-- 사용자는 자신의 문의만 생성할 수 있음
CREATE POLICY inquiries_insert_policy ON inquiries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 문의 업데이트는 관련 사용자와 관리자만 가능
CREATE POLICY inquiries_update_policy ON inquiries
    FOR UPDATE
    USING (
        auth.uid() = user_id OR 
        auth.uid() = distributor_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'developer', 'operator')
        )
    );

-- inquiry_messages 테이블 RLS
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;

-- 문의에 관련된 사용자만 메시지를 볼 수 있음
CREATE POLICY inquiry_messages_select_policy ON inquiry_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM inquiries 
            WHERE inquiries.id = inquiry_messages.inquiry_id 
            AND (
                inquiries.user_id = auth.uid() OR 
                inquiries.distributor_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'developer', 'operator')
                )
            )
        )
    );

-- 문의에 관련된 사용자만 메시지를 생성할 수 있음
CREATE POLICY inquiry_messages_insert_policy ON inquiry_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM inquiries 
            WHERE inquiries.id = inquiry_messages.inquiry_id 
            AND (
                inquiries.user_id = auth.uid() OR 
                inquiries.distributor_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('admin', 'developer', 'operator')
                )
            )
        )
    );

-- =============================================================================
-- 테이블 코멘트
-- =============================================================================

COMMENT ON TABLE inquiries IS '1:1 문의 메인 테이블';
COMMENT ON COLUMN inquiries.status IS 'open: 열림, in_progress: 처리중, resolved: 해결됨, closed: 종료됨';
COMMENT ON COLUMN inquiries.priority IS 'low: 낮음, normal: 보통, high: 높음, urgent: 긴급';

COMMENT ON TABLE inquiry_messages IS '1:1 문의 메시지 테이블';
COMMENT ON COLUMN inquiry_messages.sender_role IS '발신자 역할 (user: 사용자, distributor: 총판, admin: 관리자)';
COMMENT ON COLUMN inquiry_messages.attachments IS '첨부파일 정보 JSON 배열';