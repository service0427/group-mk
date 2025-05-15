-- beginner-role-rls-fix.sql
-- 초보자 역할에 대한 RLS 정책 수정

-- 1. 사용자 역할 정보 확인
SELECT 
  id, 
  email, 
  role as db_role
FROM users
WHERE role = 'beginner'
ORDER BY email;

-- 2. 공지사항에 대한 RLS 정책 업데이트 (초보자도 읽기 허용)
ALTER TABLE notice ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 DROP
DROP POLICY IF EXISTS notice_select_policy ON notice;

-- 읽기 정책 생성 (모든 인증된 사용자가 읽을 수 있음)
CREATE POLICY notice_select_policy ON notice
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        is_active = true
    );

-- 3. FAQ에 대한 RLS 정책 업데이트 (초보자도 읽기 허용)
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 DROP
DROP POLICY IF EXISTS faq_select_policy ON faq;

-- 읽기 정책 생성 (모든 인증된 사용자가 읽을 수 있음)
CREATE POLICY faq_select_policy ON faq
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        is_active = true
    );

-- 4. 캐시 충전 요청에 대한 RLS 정책 업데이트 (초보자도 작성 허용)
ALTER TABLE cash_charge_requests ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 DROP
DROP POLICY IF EXISTS cash_charge_requests_insert_policy ON cash_charge_requests;
DROP POLICY IF EXISTS cash_charge_requests_select_policy ON cash_charge_requests;

-- 읽기 정책 생성 (자신의 요청만 읽을 수 있음)
CREATE POLICY cash_charge_requests_select_policy ON cash_charge_requests
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        -- Supabase 구조에 따라 토큰에서 역할 추출 방식을 조정해야 할 수 있습니다
        (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('operator', 'developer')
    );

-- 생성 정책 (모든 인증된 사용자가 요청 생성 가능)
CREATE POLICY cash_charge_requests_insert_policy ON cash_charge_requests
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = user_id
    );

-- 5. 사용자 잔액에 대한 RLS 정책 업데이트 (초보자도 읽기 허용)
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 DROP
DROP POLICY IF EXISTS user_balances_select_policy ON user_balances;

-- 읽기 정책 생성 (자신의 잔액만 읽을 수 있음)
CREATE POLICY user_balances_select_policy ON user_balances
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        -- Supabase 구조에 따라 토큰에서 역할 추출 방식을 조정해야 할 수 있습니다
        (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('operator', 'developer')
    );

-- 6. auth_logs 테이블에 대한 RLS 정책 업데이트 (초보자도 자신의 로그 읽기 허용)
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 DROP
DROP POLICY IF EXISTS auth_logs_select_policy ON auth_logs;

-- 읽기 정책 생성 (자신의 로그만 읽을 수 있음)
CREATE POLICY auth_logs_select_policy ON auth_logs
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        -- Supabase 구조에 따라 토큰에서 역할 추출 방식을 조정해야 할 수 있습니다
        (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('operator', 'developer')
    );

-- 7. users 테이블에 대한 RLS 정책 업데이트 (초보자도 자신의 정보 읽기 허용)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 DROP
DROP POLICY IF EXISTS users_select_policy ON users;

-- 읽기 정책 생성 (자신의 정보는 읽을 수 있음, 운영자는 모든 사용자 정보 읽기 가능)
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        auth.uid() = id OR
        -- Supabase 구조에 따라 토큰에서 역할 추출 방식을 조정해야 할 수 있습니다
        (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('operator', 'developer')
    );

-- 테스트 계정을 위한 role 업데이트 쿼리 (필요 시 주석 해제 후 사용)
/*
-- 사용 전에 auth.users 테이블의 정확한 구조를 확인하세요
-- raw_user_meta_data 필드가 없는 경우, 대체 필드를 사용해야 합니다.
UPDATE auth.users
SET user_metadata = user_metadata || jsonb_build_object('role', 'beginner')
WHERE email = '테스트할_이메일@example.com';

UPDATE users
SET role = 'beginner'
WHERE email = '테스트할_이메일@example.com';
*/