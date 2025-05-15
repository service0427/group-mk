-- 이 스크립트는 'users' 테이블에 대한 RLS 정책을 생성하거나 업데이트하여
-- 초보자 역할을 가진 사용자가 users 테이블을 조회할 수 있도록 합니다.

-- 기존 정책 삭제 (오류 방지를 위해 IF EXISTS 사용)
DROP POLICY IF EXISTS "사용자는 자신의 정보만 볼 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "관리자는 모든 사용자 정보를 볼 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "사용자는 자신의 정보만 수정할 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "관리자는 모든 사용자 정보를 수정할 수 있음" ON "public"."users";

-- RLS가 활성화되어 있는지 확인하고, 비활성화된 경우 활성화
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'users'
        AND rowsecurity = TRUE
    ) THEN
        ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 읽기 정책 - 사용자는 자신의 정보만 볼 수 있음 (초보자 포함)
CREATE POLICY "사용자는 자신의 정보만 볼 수 있음"
ON "public"."users"
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
);

-- 읽기 정책 - 관리자(운영자, 개발자)는 모든 사용자 정보를 볼 수 있음
CREATE POLICY "관리자는 모든 사용자 정보를 볼 수 있음"
ON "public"."users"
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

-- 수정 정책 - 사용자는 자신의 정보만 업데이트할 수 있음 (초보자 포함)
CREATE POLICY "사용자는 자신의 정보만 수정할 수 있음"
ON "public"."users"
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
);

-- 수정 정책 - 관리자(운영자, 개발자)는 모든 사용자 정보를 수정할 수 있음
CREATE POLICY "관리자는 모든 사용자 정보를 수정할 수 있음"
ON "public"."users"
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

-- 삽입 정책 - 인증된 사용자는 새 계정을 생성할 수 있음 (주로 가입 시 사용)
CREATE POLICY "새 계정 생성"
ON "public"."users"
FOR INSERT
TO authenticated
WITH CHECK (
    true
);

-- 정책 확인을 위한 간단한 쿼리
SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'users';