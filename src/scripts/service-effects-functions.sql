-- service_effects 조회 함수
CREATE OR REPLACE FUNCTION get_service_effect(p_service_type TEXT)
RETURNS TABLE (
    id UUID,
    service_type TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.service_type,
        se.content,
        se.created_at,
        se.updated_at,
        se.updated_by
    FROM service_effects se
    WHERE se.service_type = p_service_type;
END;
$$;

-- service_effects 저장 함수 (INSERT or UPDATE)
CREATE OR REPLACE FUNCTION save_service_effect(
    p_service_type TEXT,
    p_content TEXT,
    p_updated_by TEXT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 권한 체크: operator 또는 developer만 가능
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('operator', 'developer')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- UPSERT 처리
    INSERT INTO service_effects (service_type, content, updated_by)
    VALUES (p_service_type, p_content, p_updated_by)
    ON CONFLICT (service_type) 
    DO UPDATE SET 
        content = EXCLUDED.content,
        updated_by = EXCLUDED.updated_by,
        updated_at = TIMEZONE('Asia/Seoul', NOW());
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_service_effect(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_service_effect(TEXT, TEXT, TEXT) TO authenticated;