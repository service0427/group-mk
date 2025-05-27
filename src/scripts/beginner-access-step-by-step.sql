-- beginner-access-step-by-step.sql
-- 비기너 역할에 대한 접근 권한 설정 (단계별 실행)
-- 이 스크립트는 각 테이블별로 분리되어 있어서 한 부분에서 오류가 발생해도 다른 부분을 실행할 수 있습니다.

--------------------------------------------------
-- 1. notice 테이블 (공지사항)
--------------------------------------------------
DO $$
BEGIN
    -- 테이블 존재 여부 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notice') THEN
        -- RLS 설정
        EXECUTE 'ALTER TABLE notice ENABLE ROW LEVEL SECURITY';
        
        -- 기존 정책 삭제 (있다면)
        IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notice' AND policyname = 'notice_for_all_users') THEN
            EXECUTE 'DROP POLICY notice_for_all_users ON notice';
        END IF;
        
        -- 새 정책 생성
        EXECUTE 'CREATE POLICY notice_for_all_users ON notice FOR SELECT USING (auth.role() = ''authenticated'')';
        
        RAISE NOTICE 'notice 테이블에 대한 RLS 정책이 설정되었습니다.';
    ELSE
        RAISE NOTICE 'notice 테이블이 존재하지 않습니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'notice 테이블 처리 중 오류 발생: %', SQLERRM;
END $$;

--------------------------------------------------
-- 2. faq 테이블
--------------------------------------------------
DO $$
BEGIN
    -- 테이블 존재 여부 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faq') THEN
        -- RLS 설정
        EXECUTE 'ALTER TABLE faq ENABLE ROW LEVEL SECURITY';
        
        -- 기존 정책 삭제 (있다면)
        IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'faq' AND policyname = 'faq_for_all_users') THEN
            EXECUTE 'DROP POLICY faq_for_all_users ON faq';
        END IF;
        
        -- 새 정책 생성
        EXECUTE 'CREATE POLICY faq_for_all_users ON faq FOR SELECT USING (auth.role() = ''authenticated'')';
        
        RAISE NOTICE 'faq 테이블에 대한 RLS 정책이 설정되었습니다.';
    ELSE
        RAISE NOTICE 'faq 테이블이 존재하지 않습니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'faq 테이블 처리 중 오류 발생: %', SQLERRM;
END $$;

--------------------------------------------------
-- 3. cash_charge_requests 테이블
--------------------------------------------------
DO $$
BEGIN
    -- 테이블 존재 여부 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cash_charge_requests') THEN
        -- RLS 설정
        EXECUTE 'ALTER TABLE cash_charge_requests ENABLE ROW LEVEL SECURITY';
        
        -- 기존 정책 삭제 (있다면)
        IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cash_charge_requests' AND policyname = 'cash_charge_requests_for_users') THEN
            EXECUTE 'DROP POLICY cash_charge_requests_for_users ON cash_charge_requests';
        END IF;
        
        IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cash_charge_requests' AND policyname = 'cash_charge_requests_insert_for_users') THEN
            EXECUTE 'DROP POLICY cash_charge_requests_insert_for_users ON cash_charge_requests';
        END IF;
        
        -- 새 정책 생성
        EXECUTE 'CREATE POLICY cash_charge_requests_for_users ON cash_charge_requests FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY cash_charge_requests_insert_for_users ON cash_charge_requests FOR INSERT WITH CHECK (auth.uid() = user_id)';
        
        RAISE NOTICE 'cash_charge_requests 테이블에 대한 RLS 정책이 설정되었습니다.';
    ELSE
        RAISE NOTICE 'cash_charge_requests 테이블이 존재하지 않습니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'cash_charge_requests 테이블 처리 중 오류 발생: %', SQLERRM;
END $$;

--------------------------------------------------
-- 4. user_balances 테이블
--------------------------------------------------
DO $$
BEGIN
    -- 테이블 존재 여부 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_balances') THEN
        -- RLS 설정
        EXECUTE 'ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY';
        
        -- 기존 정책 삭제 (있다면)
        IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_balances' AND policyname = 'user_balances_for_users') THEN
            EXECUTE 'DROP POLICY user_balances_for_users ON user_balances';
        END IF;
        
        -- 새 정책 생성
        EXECUTE 'CREATE POLICY user_balances_for_users ON user_balances FOR SELECT USING (auth.uid() = user_id)';
        
        RAISE NOTICE 'user_balances 테이블에 대한 RLS 정책이 설정되었습니다.';
    ELSE
        RAISE NOTICE 'user_balances 테이블이 존재하지 않습니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'user_balances 테이블 처리 중 오류 발생: %', SQLERRM;
END $$;

--------------------------------------------------
-- 5. users 테이블
--------------------------------------------------
DO $$
BEGIN
    -- 테이블 존재 여부 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- RLS 설정
        EXECUTE 'ALTER TABLE users ENABLE ROW LEVEL SECURITY';
        
        -- 기존 정책 삭제 (있다면)
        IF EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_for_users') THEN
            EXECUTE 'DROP POLICY users_for_users ON users';
        END IF;
        
        -- 새 정책 생성
        EXECUTE 'CREATE POLICY users_for_users ON users FOR SELECT USING (auth.uid() = id)';
        
        RAISE NOTICE 'users 테이블에 대한 RLS 정책이 설정되었습니다.';
    ELSE
        RAISE NOTICE 'users 테이블이 존재하지 않습니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'users 테이블 처리 중 오류 발생: %', SQLERRM;
END $$;