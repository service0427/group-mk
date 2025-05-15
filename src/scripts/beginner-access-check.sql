-- beginner-access-check.sql
-- 테이블 존재 여부 및 RLS 설정 확인 스크립트

-- 먼저 각 테이블의 존재 여부를 확인합니다
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notice'
) AS notice_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'faq'
) AS faq_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cash_charge_requests'
) AS cash_charge_requests_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_balances'
) AS user_balances_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_logs'
) AS auth_logs_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS users_exists;

-- RLS 설정 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notice', 'faq', 'cash_charge_requests', 'user_balances', 'users');

-- 정책 확인
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';