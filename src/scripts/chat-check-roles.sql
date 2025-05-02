-- chat-check-roles.sql
-- 역할 관련 문제 진단을 위한 스크립트

-- 1. auth.users 테이블에서 역할 정보 확인
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as auth_role
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL
ORDER BY email;

-- 2. public.users 테이블에서 역할 정보 확인
SELECT 
  id, 
  email, 
  role as db_role,
  raw_user_meta_data->>'role' as meta_role,
  status
FROM users
ORDER BY email;

-- 3. 역할 불일치 확인 (auth와 public 테이블 비교)
SELECT 
  a.email,
  a.raw_user_meta_data->>'role' as auth_role,
  u.role as db_role,
  u.raw_user_meta_data->>'role' as meta_role
FROM auth.users a
JOIN users u ON a.id = u.id
WHERE (a.raw_user_meta_data->>'role') IS DISTINCT FROM u.role
OR (a.raw_user_meta_data->>'role') IS DISTINCT FROM (u.raw_user_meta_data->>'role')
ORDER BY a.email;

-- 4. 'operator' 역할을 가진 사용자 확인
SELECT 
  email,
  raw_user_meta_data->>'role' as auth_role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'operator'
ORDER BY email;

-- 5. 'operator' 역할이 있는지 확인 (없으면 테스트 계정 생성)
DO $$
DECLARE
  operator_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO operator_count 
  FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'operator';
  
  IF operator_count = 0 THEN
    RAISE NOTICE '운영자 역할을 가진 사용자가 없습니다. 테스트 계정을 생성하세요.';
  ELSE
    RAISE NOTICE '% 개의 운영자 계정이 있습니다.', operator_count;
  END IF;
END $$;

-- 6. 운영자 역할 추가 쿼리 예시 (필요시 주석 해제 후 사용)
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"operator"'
-- )
-- WHERE email = '변경할_이메일@example.com';

-- 7. public.users 테이블의 역할도 함께 업데이트 예시 (필요시 주석 해제 후 사용)
-- UPDATE users
-- SET role = 'operator',
--     raw_user_meta_data = jsonb_set(
--       COALESCE(raw_user_meta_data, '{}'::jsonb),
--       '{role}',
--       '"operator"'
--     )
-- WHERE email = '변경할_이메일@example.com';