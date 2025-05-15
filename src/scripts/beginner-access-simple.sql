-- beginner-access-simple.sql
-- 초보자 역할에 대한 간단한 접근 권한 설정

-- 공지사항 테이블 접근 권한
ALTER TABLE notice ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 공지사항을 볼 수 있도록 설정
CREATE POLICY notice_for_all_users ON notice
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- FAQ 테이블 접근 권한
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 FAQ를 볼 수 있도록 설정
CREATE POLICY faq_for_all_users ON faq
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 캐시 충전 요청 테이블 접근 권한
ALTER TABLE cash_charge_requests ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 충전 요청을 볼 수 있도록 설정
CREATE POLICY cash_charge_requests_for_users ON cash_charge_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- 사용자가 충전 요청을 생성할 수 있도록 설정
CREATE POLICY cash_charge_requests_insert_for_users ON cash_charge_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 사용자 잔액 테이블 접근 권한
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 잔액을 볼 수 있도록 설정
CREATE POLICY user_balances_for_users ON user_balances
    FOR SELECT
    USING (auth.uid() = user_id);

-- 로그인 기록 테이블은 존재하지 않는 것 같습니다
-- 실제 로그인 기록 테이블 이름을 확인 후 아래 코드를 주석 해제하여 사용하세요
/*
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 로그인 기록을 볼 수 있도록 설정
CREATE POLICY auth_logs_for_users ON auth_logs
    FOR SELECT
    USING (auth.uid() = user_id);
*/

-- 사용자 정보 테이블 접근 권한
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 정보를 볼 수 있도록 설정
CREATE POLICY users_for_users ON users
    FOR SELECT
    USING (auth.uid() = id);