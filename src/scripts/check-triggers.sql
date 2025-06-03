-- 현재 데이터베이스의 모든 트리거 확인

-- 1. 모든 트리거 목록 조회
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS trigger_timing,
    CASE t.tgtype::integer & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT OR UPDATE'
        WHEN 24 THEN 'UPDATE OR DELETE'
        WHEN 28 THEN 'INSERT OR UPDATE OR DELETE'
        ELSE 'UNKNOWN'
    END AS trigger_event,
    t.tgenabled AS is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
    AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, c.relname, t.tgname;

-- 2. 특히 중요한 트리거들 확인
SELECT 
    'slots 테이블의 user_slot_number 트리거' AS description,
    EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_user_slot_number'
    ) AS exists;

SELECT 
    'users 테이블의 role 동기화 트리거' AS description,
    EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'sync_user_role_trigger'
    ) AS exists;

SELECT 
    'auth.users의 새 사용자 생성 트리거' AS description,
    EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE t.tgname = 'on_auth_user_created'
        AND n.nspname = 'auth'
    ) AS exists;

-- 3. 트리거 함수들 확인
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
    'handle_new_user',
    'handle_user_update',
    'handle_user_delete',
    'sync_user_role_to_auth',
    'generate_user_slot_number',
    'notify_chat_message',
    'update_excel_template_updated_at'
)
AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;