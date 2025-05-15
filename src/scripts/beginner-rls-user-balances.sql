-- 이 스크립트는 'user_balances' 테이블에 대한 RLS 정책을 업데이트하여
-- 초보자 역할을 가진 사용자가 자신의 잔액을 볼 수 있도록 합니다.

-- 기존 정책 삭제 (오류 방지를 위해 IF EXISTS 사용)
DROP POLICY IF EXISTS "사용자는 자신의 잔액만 볼 수 있음" ON "public"."user_balances";
DROP POLICY IF EXISTS "관리자는 모든 잔액을 볼 수 있음" ON "public"."user_balances";
DROP POLICY IF EXISTS "사용자는 자신의 잔액만 업데이트할 수 있음" ON "public"."user_balances";
DROP POLICY IF EXISTS "관리자는 모든 잔액을 업데이트할 수 있음" ON "public"."user_balances";
DROP POLICY IF EXISTS "사용자 잔액 항목 생성" ON "public"."user_balances";

-- RLS가 활성화되어 있는지 확인하고, 비활성화된 경우 활성화
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'user_balances'
        AND rowsecurity = TRUE
    ) THEN
        ALTER TABLE "public"."user_balances" ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 읽기 정책 - 사용자는 자신의 잔액만 볼 수 있음 (초보자 포함)
CREATE POLICY "사용자는 자신의 잔액만 볼 수 있음"
ON "public"."user_balances"
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id
);

-- 읽기 정책 - 관리자(운영자, 개발자)는 모든 잔액을 볼 수 있음
CREATE POLICY "관리자는 모든 잔액을 볼 수 있음"
ON "public"."user_balances"
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE 
            users.id = auth.uid() AND 
            (users.role = 'operator' OR users.role = 'developer')
    )
);

-- 수정 정책 - 사용자는 자신의 잔액만 업데이트할 수 있음 (초보자 제외)
CREATE POLICY "사용자는 자신의 잔액만 업데이트할 수 있음"
ON "public"."user_balances"
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1
        FROM users
        WHERE 
            users.id = auth.uid() AND 
            users.role != 'beginner'
    )
);

-- 수정 정책 - 관리자(운영자, 개발자)는 모든 잔액을 업데이트할 수 있음
CREATE POLICY "관리자는 모든 잔액을 업데이트할 수 있음"
ON "public"."user_balances"
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE 
            users.id = auth.uid() AND 
            (users.role = 'operator' OR users.role = 'developer')
    )
);

-- 삽입 정책 - 모든 인증된 사용자는 자신의 잔액 항목을 생성할 수 있음
CREATE POLICY "사용자 잔액 항목 생성"
ON "public"."user_balances"
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- RLS 확인 쿼리 (선택적으로 실행 - 오류 발생시 이 부분은 제외하고 실행하세요)
-- Supabase 버전에 따라 아래 쿼리가 호환되지 않을 수 있습니다
/*
SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS policy_command,
    roles,
    qual AS policy_using_qualifier,
    with_check AS policy_with_check_qualifier
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'user_balances'
ORDER BY
    policyname;
*/

-- 정책 확인을 위한 간단한 쿼리 (실행 가능)
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'user_balances';