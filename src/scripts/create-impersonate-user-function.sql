-- 사용자 전환 함수
CREATE OR REPLACE FUNCTION public.impersonate_user(
  p_target_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_impersonator_id UUID;
  v_impersonator_role TEXT;
  v_target_user RECORD;
  v_impersonation_id UUID;
  v_result JSON;
BEGIN
  -- 현재 사용자 ID 가져오기
  v_impersonator_id := auth.uid();
  
  IF v_impersonator_id IS NULL THEN
    RAISE EXCEPTION '인증되지 않은 사용자입니다.';
  END IF;
  
  -- 현재 사용자의 역할 확인
  SELECT role INTO v_impersonator_role
  FROM public.users
  WHERE id = v_impersonator_id;
  
  -- 개발자나 운영자만 사용 가능
  IF v_impersonator_role NOT IN ('developer', 'operator') THEN
    RAISE EXCEPTION '권한이 없습니다. 개발자나 운영자만 사용할 수 있습니다.';
  END IF;
  
  -- 자기 자신으로 전환 방지
  IF v_impersonator_id = p_target_user_id THEN
    RAISE EXCEPTION '자기 자신으로는 전환할 수 없습니다.';
  END IF;
  
  -- 대상 사용자 정보 조회
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.status,
    au.raw_user_meta_data
  INTO v_target_user
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE u.id = p_target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '대상 사용자를 찾을 수 없습니다.';
  END IF;
  
  -- 대상이 개발자인 경우 전환 방지 (운영자는 개발자로 전환 불가)
  IF v_impersonator_role = 'operator' AND v_target_user.role = 'developer' THEN
    RAISE EXCEPTION '운영자는 개발자 계정으로 전환할 수 없습니다.';
  END IF;
  
  -- 기존 활성 전환 세션 종료
  UPDATE public.user_impersonations
  SET 
    is_active = false,
    ended_at = NOW()
  WHERE impersonator_id = v_impersonator_id
    AND is_active = true;
  
  -- 새로운 전환 기록 생성
  INSERT INTO public.user_impersonations (
    impersonator_id,
    target_user_id,
    reason
  ) VALUES (
    v_impersonator_id,
    p_target_user_id,
    p_reason
  ) RETURNING id INTO v_impersonation_id;
  
  -- 결과 반환
  v_result := json_build_object(
    'success', true,
    'impersonation_id', v_impersonation_id,
    'target_user', json_build_object(
      'id', v_target_user.id,
      'email', v_target_user.email,
      'full_name', v_target_user.full_name,
      'role', v_target_user.role,
      'status', v_target_user.status,
      'metadata', v_target_user.raw_user_meta_data
    )
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 전환 종료 함수
CREATE OR REPLACE FUNCTION public.stop_impersonation()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_updated_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '인증되지 않은 사용자입니다.';
  END IF;
  
  -- 활성 전환 세션 종료
  UPDATE public.user_impersonations
  SET 
    is_active = false,
    ended_at = NOW()
  WHERE impersonator_id = v_user_id
    AND is_active = true;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'sessions_ended', v_updated_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 활성 전환 확인 함수
CREATE OR REPLACE FUNCTION public.get_active_impersonation()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_impersonation RECORD;
BEGIN
  v_user_id := auth.uid();
  
  SELECT 
    i.id,
    i.target_user_id,
    i.started_at,
    i.reason,
    u.email AS target_email,
    u.full_name AS target_name,
    u.role AS target_role
  INTO v_impersonation
  FROM public.user_impersonations i
  JOIN public.users u ON i.target_user_id = u.id
  WHERE i.impersonator_id = v_user_id
    AND i.is_active = true
  ORDER BY i.started_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('active', false);
  END IF;
  
  RETURN json_build_object(
    'active', true,
    'impersonation', json_build_object(
      'id', v_impersonation.id,
      'target_user_id', v_impersonation.target_user_id,
      'target_email', v_impersonation.target_email,
      'target_name', v_impersonation.target_name,
      'target_role', v_impersonation.target_role,
      'started_at', v_impersonation.started_at,
      'reason', v_impersonation.reason
    )
  );
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION public.impersonate_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stop_impersonation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_impersonation() TO authenticated;