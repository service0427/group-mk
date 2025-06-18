-- 보장형 슬롯 엑셀 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS guarantee_excel_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    columns JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_guarantee_excel_templates_user_id ON guarantee_excel_templates(user_id);
CREATE INDEX idx_guarantee_excel_templates_created_at ON guarantee_excel_templates(created_at);

-- RLS 정책 설정
ALTER TABLE guarantee_excel_templates ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 템플릿만 조회 가능
CREATE POLICY "Users can view own templates" ON guarantee_excel_templates
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 템플릿만 생성 가능
CREATE POLICY "Users can create own templates" ON guarantee_excel_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 템플릿만 수정 가능
CREATE POLICY "Users can update own templates" ON guarantee_excel_templates
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 템플릿만 삭제 가능
CREATE POLICY "Users can delete own templates" ON guarantee_excel_templates
    FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_guarantee_excel_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guarantee_excel_templates_updated_at_trigger
    BEFORE UPDATE ON guarantee_excel_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_guarantee_excel_templates_updated_at();