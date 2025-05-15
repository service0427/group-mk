-- beginner-access-consolidated.sql
-- 초보자 역할에 대한 접근 권한 통합 설정 스크립트
-- 기존 정책을 모두 삭제하고 새로 추가합니다.

--------------------------------------------------
-- 기존 RLS 정책 삭제 (모든 관련 테이블)
--------------------------------------------------
DO $$
DECLARE
    tables_array text[] := ARRAY['notice', 'faq', 'cash_charge_requests', 'user_balances', 'users'];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY tables_array
    LOOP
        -- 테이블 존재 여부 확인
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            -- 해당 테이블의 모든 정책 삭제
            EXECUTE format('DROP POLICY IF EXISTS %1$s_for_all_users ON %1$s', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %1$s_for_users ON %1$s', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %1$s_insert_for_users ON %1$s', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %1$s_select_policy ON %1$s', table_name);
            EXECUTE format('DROP POLICY IF EXISTS %1$s_insert_policy ON %1$s', table_name);
            
            RAISE NOTICE '% 테이블의 기존 정책이 삭제되었습니다.', table_name;
        ELSE
            RAISE NOTICE '% 테이블이 존재하지 않습니다.', table_name;
        END IF;
    END LOOP;
END $$;

--------------------------------------------------
-- 1. notice 테이블 (공지사항)
--------------------------------------------------
DO $$
BEGIN
    -- 테이블 존재 여부 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notice') THEN
        -- RLS 설정
        EXECUTE 'ALTER TABLE notice ENABLE ROW LEVEL SECURITY';
        
        -- 정책 생성 - 모든 인증된 사용자가 공지사항을 볼 수 있음
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
        
        -- 정책 생성 - 모든 인증된 사용자가 FAQ를 볼 수 있음
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
        
        -- 정책 생성 - 사용자는 자신의 요청만 볼 수 있음
        EXECUTE 'CREATE POLICY cash_charge_requests_for_users ON cash_charge_requests FOR SELECT USING (auth.uid() = user_id)';
        
        -- 정책 생성 - 사용자는 자신의 요청만 생성할 수 있음
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
        
        -- 정책 생성 - 사용자는 자신의 잔액만 볼 수 있음
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
        
        -- 정책 생성 - 사용자는 자신의 정보만 볼 수 있음
        EXECUTE 'CREATE POLICY users_for_users ON users FOR SELECT USING (auth.uid() = id)';
        
        RAISE NOTICE 'users 테이블에 대한 RLS 정책이 설정되었습니다.';
    ELSE
        RAISE NOTICE 'users 테이블이 존재하지 않습니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'users 테이블 처리 중 오류 발생: %', SQLERRM;
END $$;

--------------------------------------------------
-- 결과 확인 - 설정된 RLS 정책 표시
--------------------------------------------------
SELECT tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('notice', 'faq', 'cash_charge_requests', 'user_balances', 'users')
ORDER BY tablename, policyname;