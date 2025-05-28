-- Excel Export Templates 테이블 생성
CREATE TABLE IF NOT EXISTS excel_export_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  columns JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_excel_export_templates_user_id ON excel_export_templates(user_id);
CREATE INDEX idx_excel_export_templates_created_at ON excel_export_templates(created_at DESC);

-- RLS 활성화
ALTER TABLE excel_export_templates ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 사용자는 자신의 템플릿만 볼 수 있음
CREATE POLICY "Users can view own templates" ON excel_export_templates
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 템플릿만 생성할 수 있음
CREATE POLICY "Users can create own templates" ON excel_export_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 템플릿만 수정할 수 있음
CREATE POLICY "Users can update own templates" ON excel_export_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 템플릿만 삭제할 수 있음 (기본 템플릿 제외)
CREATE POLICY "Users can delete own non-default templates" ON excel_export_templates
  FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_excel_export_templates_updated_at
  BEFORE UPDATE ON excel_export_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 템플릿 생성 함수
CREATE OR REPLACE FUNCTION create_default_excel_template(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO excel_export_templates (user_id, name, columns, is_default)
  VALUES (
    p_user_id,
    '기본 템플릿',
    '[
      {"field": "id", "label": "슬롯 ID", "enabled": true, "width": 20},
      {"field": "status", "label": "상태", "enabled": true, "width": 15},
      {"field": "campaign_name", "label": "캠페인명", "enabled": true, "width": 30},
      {"field": "user_email", "label": "사용자 이메일", "enabled": true, "width": 30},
      {"field": "user_name", "label": "사용자 이름", "enabled": true, "width": 20},
      {"field": "product_name", "label": "상품명", "enabled": true, "width": 30},
      {"field": "keywords", "label": "키워드", "enabled": true, "width": 40},
      {"field": "url", "label": "URL", "enabled": true, "width": 50},
      {"field": "mid", "label": "MID", "enabled": true, "width": 20},
      {"field": "quantity", "label": "작업량", "enabled": true, "width": 15},
      {"field": "due_days", "label": "작업일수", "enabled": true, "width": 15},
      {"field": "start_date", "label": "시작일", "enabled": true, "width": 20},
      {"field": "end_date", "label": "종료일", "enabled": true, "width": 20},
      {"field": "created_at", "label": "생성일", "enabled": true, "width": 25},
      {"field": "submitted_at", "label": "제출일", "enabled": true, "width": 25},
      {"field": "processed_at", "label": "처리일", "enabled": true, "width": 25},
      {"field": "mat_reason", "label": "총판 메모", "enabled": true, "width": 40},
      {"field": "rejection_reason", "label": "반려 사유", "enabled": false, "width": 40},
      {"field": "user_reason", "label": "사용자 메모", "enabled": false, "width": 40}
    ]'::jsonb,
    true
  )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 사용자 생성 시 기본 템플릿 자동 생성 트리거
CREATE OR REPLACE FUNCTION create_default_template_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- ADMIN과 총판 역할을 가진 사용자에게만 기본 템플릿 생성
  IF NEW.role IN ('admin', 'mat') THEN
    PERFORM create_default_excel_template(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블에 트리거 생성 (users 테이블이 있다고 가정)
-- CREATE TRIGGER create_default_template_on_user_insert
--   AFTER INSERT ON users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_template_for_new_user();

-- 샘플 데이터 (선택사항)
-- INSERT INTO excel_export_templates (user_id, name, columns)
-- SELECT 
--   auth.uid(),
--   '간단 보기',
--   '[
--     {"field": "id", "label": "슬롯 ID", "enabled": true, "width": 20},
--     {"field": "campaign_name", "label": "캠페인명", "enabled": true, "width": 30},
--     {"field": "user_name", "label": "사용자 이름", "enabled": true, "width": 20},
--     {"field": "product_name", "label": "상품명", "enabled": true, "width": 30},
--     {"field": "status", "label": "상태", "enabled": true, "width": 15}
--   ]'::jsonb
-- WHERE auth.uid() IS NOT NULL;