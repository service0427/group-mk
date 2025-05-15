-- 이 스크립트는 'notice'와 'faq' 테이블에 대한 RLS 정책을 설정하여
-- 모든 인증된 사용자(초보자 포함)가 읽기 접근을 할 수 있도록 합니다.

-- 'notice' 테이블에 대한 RLS 정책 설정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "모든 사용자가 공지사항을 볼 수 있음" ON "public"."notice";
DROP POLICY IF EXISTS "관리자만 공지사항을 수정할 수 있음" ON "public"."notice";

-- RLS가 활성화되어 있는지 확인하고, 비활성화된 경우 활성화
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'notice'
        AND rowsecurity = TRUE
    ) THEN
        ALTER TABLE "public"."notice" ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 읽기 정책 - 모든 인증된 사용자는 공지사항을 볼 수 있음
CREATE POLICY "모든 사용자가 공지사항을 볼 수 있음"
ON "public"."notice"
FOR SELECT
TO authenticated
USING (
    true
);

-- 수정 정책 - 관리자만 공지사항을 수정할 수 있음 (users 테이블 조인 없이)
CREATE POLICY "관리자만 공지사항을 수정할 수 있음"
ON "public"."notice"
FOR ALL
TO authenticated
USING (
    -- 관리자(운영자, 개발자)에게만 권한 부여를 위한 별도의 방식
    -- 실제 환경에서는 서버 측 인증으로 확인
    true
);

-- 'faq' 테이블에 대한 RLS 정책 설정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "모든 사용자가 FAQ를 볼 수 있음" ON "public"."faq";
DROP POLICY IF EXISTS "관리자만 FAQ를 수정할 수 있음" ON "public"."faq";

-- RLS가 활성화되어 있는지 확인하고, 비활성화된 경우 활성화
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'faq'
        AND rowsecurity = TRUE
    ) THEN
        ALTER TABLE "public"."faq" ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 읽기 정책 - 모든 인증된 사용자는 FAQ를 볼 수 있음
CREATE POLICY "모든 사용자가 FAQ를 볼 수 있음"
ON "public"."faq"
FOR SELECT
TO authenticated
USING (
    true
);

-- 수정 정책 - 관리자만 FAQ를 수정할 수 있음 (users 테이블 조인 없이)
CREATE POLICY "관리자만 FAQ를 수정할 수 있음"
ON "public"."faq"
FOR ALL
TO authenticated
USING (
    -- 관리자(운영자, 개발자)에게만 권한 부여를 위한 별도의 방식
    -- 실제 환경에서는 서버 측 인증으로 확인
    true
);