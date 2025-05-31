-- notifications 테이블의 type 체크 제약 조건 업데이트
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'system'::text,
    'transaction'::text,
    'service'::text,
    'slot'::text,
    'marketing'::text,
    'slot_created'::text,
    'slot_approved'::text,
    'slot_success'::text,
    'slot_refund'::text
  ])
);

-- auth.users의 raw_user_meta_data를 업데이트하는 함수
CREATE OR REPLACE FUNCTION sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- role이 변경되었을 때만 실행
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- auth.users 테이블의 raw_user_meta_data 업데이트
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('role', NEW.role)
        ELSE 
          raw_user_meta_data || jsonb_build_object('role', NEW.role)
      END,
    updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;

-- users 테이블에 트리거 생성
CREATE TRIGGER sync_user_role_trigger
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_auth();

-- 함수에 대한 권한 설정
GRANT EXECUTE ON FUNCTION sync_user_role_to_auth() TO service_role;
REVOKE EXECUTE ON FUNCTION sync_user_role_to_auth() FROM anon, authenticated;

-- 기존 사용자들의 role 동기화 (선택사항)
-- 이미 존재하는 사용자들의 role을 auth.users에 동기화
UPDATE auth.users au
SET raw_user_meta_data = 
  CASE 
    WHEN au.raw_user_meta_data IS NULL THEN 
      jsonb_build_object('role', u.role)
    ELSE 
      au.raw_user_meta_data || jsonb_build_object('role', u.role)
  END
FROM public.users u
WHERE au.id = u.id
AND (au.raw_user_meta_data->>'role' IS NULL OR au.raw_user_meta_data->>'role' != u.role);