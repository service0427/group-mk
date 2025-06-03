-- 이메일 중복 체크를 위한 데이터베이스 함수 생성
-- RLS 정책을 우회하여 안전하게 이메일 존재 여부만 확인

-- 기존 함수가 있다면 삭제
DROP FUNCTION IF EXISTS public.check_email_exists(text);

-- 이메일 존재 여부를 확인하는 함수
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자의 권한으로 실행
AS $$
DECLARE
  email_count integer;
BEGIN
  -- 이메일이 존재하는지 확인
  SELECT COUNT(*)
  INTO email_count
  FROM public.users
  WHERE LOWER(email) = LOWER(email_to_check);
  
  -- 1개 이상이면 true (이미 존재), 0이면 false (사용 가능)
  RETURN email_count > 0;
END;
$$;

-- 함수에 대한 권한 부여
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;

-- 함수 코멘트 추가
COMMENT ON FUNCTION public.check_email_exists(text) IS '회원가입 시 이메일 중복 확인용 함수';

-- 테스트
-- SELECT public.check_email_exists('test@example.com');