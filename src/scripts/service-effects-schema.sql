-- service_effects 테이블이 이미 존재하는 경우 삭제
DROP TABLE IF EXISTS service_effects CASCADE;

-- 서비스 효과 및 사용법 테이블 생성
CREATE TABLE service_effects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Seoul', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Seoul', NOW()),
    updated_by TEXT
);

-- 인덱스 생성
CREATE INDEX idx_service_effects_service_type ON service_effects(service_type);

-- RLS (Row Level Security) 활성화
ALTER TABLE service_effects ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 허용
CREATE POLICY "service_effects_select_policy" ON service_effects
    FOR SELECT USING (true);

-- 관리자 그룹(운영자, 개발자)만 생성/수정/삭제 가능
CREATE POLICY "service_effects_insert_policy" ON service_effects
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );

CREATE POLICY "service_effects_update_policy" ON service_effects
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );

CREATE POLICY "service_effects_delete_policy" ON service_effects
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('operator', 'developer')
        )
    );

-- 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_service_effects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('Asia/Seoul', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_effects_updated_at
    BEFORE UPDATE ON service_effects
    FOR EACH ROW
    EXECUTE FUNCTION update_service_effects_updated_at();

-- Public 액세스 권한 부여 (RLS로 제어되므로 안전)
GRANT ALL ON service_effects TO authenticated;
GRANT SELECT ON service_effects TO anon;