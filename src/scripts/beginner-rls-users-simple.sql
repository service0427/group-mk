-- 이 스크립트는 'users' 테이블에 대한 RLS 정책을 더 단순한 형태로 설정합니다.
-- 무한 재귀 문제를 해결하기 위해 간소화된 정책을 사용합니다.

-- 기존 정책 삭제 (오류 방지를 위해 IF EXISTS 사용)
DROP POLICY IF EXISTS "사용자는 자신의 정보만 볼 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "관리자는 모든 사용자 정보를 볼 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "사용자는 자신의 정보만 수정할 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "관리자는 모든 사용자 정보를 수정할 수 있음" ON "public"."users";
DROP POLICY IF EXISTS "새 계정 생성" ON "public"."users";

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

-- 읽기 정책 - 사용자는 모든 사용자 정보를 볼 수 있음 (단순화된 정책)
CREATE POLICY "사용자는 모든 정보 읽기 가능"
ON "public"."users"
FOR SELECT
TO authenticated
USING (
    true
);

-- 수정 정책 - 사용자는 자신의 정보만 수정할 수 있음 (단순화된 정책)
CREATE POLICY "사용자는 자신의 정보만 수정 가능"
ON "public"."users"
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
);

-- INSERT 정책 - 인증된 사용자는 새 사용자를 생성할 수 있음
CREATE POLICY "인증된 사용자 새 계정 생성 가능"
ON "public"."users"
FOR INSERT
TO authenticated
WITH CHECK (
    true
);

-- DELETE 정책 - 삭제는 기본적으로 허용하지 않음
CREATE POLICY "삭제 불가"
ON "public"."users"
FOR DELETE
TO authenticated
USING (
    false
);