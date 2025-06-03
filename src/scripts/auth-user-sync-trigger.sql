-- Auth User와 Public Users 동기화를 위한 트리거

-- 1. auth.users에서 public.users로 새 사용자 생성 시 자동 동기화하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- public.users에 새 레코드 삽입
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'beginner'), -- 기본값: beginner
    'active',
    NOW(),
    NOW()
  );
  
  -- user_balances 테이블에도 초기 잔액 설정
  INSERT INTO public.user_balances (
    user_id,
    paid_balance,
    free_balance,
    total_balance,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- 2. 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. auth.users에 INSERT 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. auth.users 업데이트 시 public.users도 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- email이나 메타데이터가 변경된 경우 public.users 업데이트
  UPDATE public.users
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    role = COALESCE(NEW.raw_user_meta_data->>'role', role),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 5. 기존 업데이트 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 6. auth.users에 UPDATE 트리거 생성
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email 
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();

-- 7. auth.users 삭제 시 public.users도 삭제하는 함수 (CASCADE 설정으로 대체 가능)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- public.users에서 해당 사용자 삭제
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- 8. 기존 삭제 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- 9. auth.users에 DELETE 트리거 생성
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- 10. 기존 auth.users에 있지만 public.users에 없는 사용자 동기화 (초기 마이그레이션용)
INSERT INTO public.users (id, email, full_name, role, status, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'beginner'),
  'active',
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 11. user_balances 테이블에도 누락된 사용자 추가
INSERT INTO public.user_balances (user_id, paid_balance, free_balance, total_balance)
SELECT 
  u.id,
  0,
  0,
  0
FROM public.users u
LEFT JOIN public.user_balances ub ON u.id = ub.user_id
WHERE ub.user_id IS NULL;