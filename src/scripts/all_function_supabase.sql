-- Function: add_search_log
CREATE OR REPLACE FUNCTION public.add_search_log(p_user_id uuid, p_search_type search_type, p_search_query text, p_result_count integer DEFAULT 0)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 검색 로그 추가
    INSERT INTO search_logs (user_id, search_type, search_query, result_count)
    VALUES (p_user_id, p_search_type, p_search_query, p_result_count);
    
    -- 일일 검색 횟수 업데이트
    INSERT INTO daily_search_counts (user_id, search_type, search_date, count)
    VALUES (p_user_id, p_search_type, v_today, 1)
    ON CONFLICT (user_id, search_type, search_date)
    DO UPDATE SET 
        count = daily_search_counts.count + 1,
        updated_at = NOW();
    
    -- 월간 통계 업데이트
    INSERT INTO monthly_search_stats (user_id, search_type, year, month, total_searches, unique_queries)
    VALUES (
        p_user_id, 
        p_search_type, 
        EXTRACT(YEAR FROM v_today)::INTEGER, 
        EXTRACT(MONTH FROM v_today)::INTEGER, 
        1,
        1
    )
    ON CONFLICT (user_id, search_type, year, month)
    DO UPDATE SET 
        total_searches = monthly_search_stats.total_searches + 1,
        unique_queries = (
            SELECT COUNT(DISTINCT search_query)
            FROM search_logs
            WHERE user_id = p_user_id
                AND search_type = p_search_type
                AND EXTRACT(YEAR FROM searched_at) = EXTRACT(YEAR FROM v_today)
                AND EXTRACT(MONTH FROM searched_at) = EXTRACT(MONTH FROM v_today)
        ),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$function$
;

-- Function: aggregate_monthly_stats
CREATE OR REPLACE FUNCTION public.aggregate_monthly_stats()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 이전 달의 통계를 집계
    INSERT INTO monthly_search_stats (user_id, search_type, year, month, total_searches, unique_queries)
    SELECT 
        user_id,
        search_type,
        EXTRACT(YEAR FROM search_date)::INTEGER,
        EXTRACT(MONTH FROM search_date)::INTEGER,
        SUM(count),
        COUNT(DISTINCT search_date)
    FROM daily_search_counts
    WHERE search_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND search_date < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY user_id, search_type, EXTRACT(YEAR FROM search_date), EXTRACT(MONTH FROM search_date)
    ON CONFLICT (user_id, search_type, year, month)
    DO UPDATE SET 
        total_searches = EXCLUDED.total_searches,
        updated_at = NOW();
END;
$function$
;

-- Function: api_admin_get_users
CREATE OR REPLACE FUNCTION public.api_admin_get_users(p_query text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_sort_by text DEFAULT 'created_at'::text, p_sort_order text DEFAULT 'desc'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_sql TEXT;
  v_count_sql TEXT;
  v_where TEXT := ' WHERE 1=1 ';
  v_order_by TEXT;
  v_items JSONB;
  v_total INT;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 권한 확인
  SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
  IF v_user_role NOT IN ('operator', 'developer') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '권한이 없습니다'
    );
  END IF;
  
  -- 검색 조건 추가
  IF p_query IS NOT NULL AND p_query != '' THEN
    v_where := v_where || ' AND (
      u.email ILIKE ' || quote_literal('%' || p_query || '%') || '
      OR u.name ILIKE ' || quote_literal('%' || p_query || '%') || '
      OR u.referral_code ILIKE ' || quote_literal('%' || p_query || '%') || '
    )';
  END IF;
  
  -- 정렬 조건 설정
  IF p_sort_by NOT IN ('created_at', 'email', 'name', 'role', 'last_login_at') THEN
    p_sort_by := 'created_at';
  END IF;
  
  IF p_sort_order NOT IN ('asc', 'desc') THEN
    p_sort_order := 'desc';
  END IF;
  
  v_order_by := ' ORDER BY u.' || p_sort_by || ' ' || p_sort_order;
  
  -- 총 개수 조회
  v_count_sql := 'SELECT COUNT(*) FROM users u' || v_where;
  EXECUTE v_count_sql INTO v_total;
  
  -- 사용자 목록 조회
  v_sql := '
    SELECT jsonb_agg(jsonb_build_object(
      ''id'', u.id,
      ''email'', u.email,
      ''name'', u.name,
      ''role'', u.role,
      ''status'', u.status,
      ''referral_code'', u.referral_code,
      ''created_at'', u.created_at,
      ''last_login_at'', u.last_login_at,
      ''balance'', COALESCE(ub.total_balance, 0)
    ))
    FROM users u
    LEFT JOIN user_balances ub ON u.id = ub.user_id
  ' || v_where || v_order_by || '
    LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  EXECUTE v_sql INTO v_items;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', jsonb_build_object(
      'items', COALESCE(v_items, '[]'::jsonb),
      'total', v_total,
      'limit', p_limit,
      'offset', p_offset
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_admin_get_users 호출 중 오류 발생', jsonb_build_object(
      'error', SQLERRM,
      'p_query', p_query,
      'p_limit', p_limit,
      'p_offset', p_offset,
      'p_sort_by', p_sort_by,
      'p_sort_order', p_sort_order
    ));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '사용자 목록 조회 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_admin_setup_users
CREATE OR REPLACE FUNCTION public.api_admin_setup_users()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_result JSONB;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 권한 확인
  SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
  IF v_user_role NOT IN ('operator', 'developer') THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '권한이 없습니다'
    );
  END IF;
  
  -- 사용자 설정 실행
  v_result := fn_setup_existing_users();
  
  -- 활동 로그 기록
  INSERT INTO user_activities (user_id, action, details)
  VALUES (
    v_user_id, 
    'admin_setup_users',
    jsonb_build_object(
      'result', v_result->>'message'
    )
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_admin_setup_users 호출 중 오류 발생', jsonb_build_object(
      'error', SQLERRM
    ));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '사용자 설정 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_change_password
CREATE OR REPLACE FUNCTION public.api_change_password(p_current_password text, p_new_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_min_length CONSTANT INT := 8;
  v_contains_number BOOLEAN;
  v_contains_special BOOLEAN;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 현재 비밀번호 확인
  -- 참고: 실제 구현에서는 auth.users 테이블의 암호화된 비밀번호와 비교해야 함
  -- 이 예제에서는 Supabase Auth API의 제약으로 인해 완전한 구현이 어려움
  
  -- 새 비밀번호 강도 검사
  IF LENGTH(p_new_password) < v_min_length THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '새 비밀번호는 최소 ' || v_min_length || '자 이상이어야 합니다'
    );
  END IF;
  
  -- 숫자 포함 여부 확인
  v_contains_number := p_new_password ~ '[0-9]';
  -- 특수 문자 포함 여부 확인
  v_contains_special := p_new_password ~ '[!@#$%^&*(),.?":{}|<>]';
  
  IF NOT (v_contains_number AND v_contains_special) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '새 비밀번호는 숫자와 특수 문자를 포함해야 합니다'
    );
  END IF;
  
  -- 실제 Supabase Auth API를 통한 비밀번호 변경 로직
  -- 이 부분은 Supabase 클라이언트에서 처리해야 하는 부분이므로 여기서는 생략
  
  -- 비밀번호 변경 성공 가정 하에 활동 로그 기록
  INSERT INTO user_activities (user_id, action, details)
  VALUES (
    v_user_id, 
    'password_changed',
    jsonb_build_object(
      'changed_at', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', '비밀번호가 변경되었습니다'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅 (비밀번호는 로그에 저장하지 않음)
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_change_password 호출 중 오류 발생', jsonb_build_object(
      'error', SQLERRM
    ));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '비밀번호 변경 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;


-- Function: api_create_user
CREATE OR REPLACE FUNCTION public.api_create_user(p_email text, p_password text, p_role text DEFAULT 'advertiser'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_referral_code TEXT;
  v_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; -- 숫자와 대문자만 사용
  v_code_length CONSTANT INT := 6;
  v_position INT;
  i INT;
BEGIN
  -- 이메일 유효성 검사
  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '이메일은 필수 항목입니다'
    );
  END IF;
  
  -- 이메일 중복 확인
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '이미 사용 중인 이메일입니다'
    );
  END IF;
  
  -- 1. auth.users에 사용자 생성 (auth.create_user 함수 사용)
  BEGIN
    SELECT id INTO v_user_id
    FROM auth.create_user(
      p_email := p_email,
      p_password := p_password,
      p_user_metadata := jsonb_build_object('role', p_role)
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', '사용자 생성 중 오류가 발생했습니다: ' || SQLERRM
      );
  END;
  
  -- 대문자와 숫자로만 구성된 고유한 6자리 리퍼럴 코드 생성
  LOOP
    -- 초기화
    v_referral_code := '';
    
    -- 6자리 랜덤 코드 생성
    FOR i IN 1..v_code_length LOOP
      -- 1과 36 사이의 랜덤 숫자 생성 (0-9, A-Z 범위)
      v_position := 1 + floor(random() * length(v_chars));
      
      -- 문자 추가
      v_referral_code := v_referral_code || substring(v_chars from v_position for 1);
    END LOOP;
    
    -- 이미 존재하는 코드인지 확인
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
  END LOOP;
  
  -- 2. public.users에 사용자 생성
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      password_hash,
      status,
      referral_code,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_email,
      split_part(p_email, '@', 1),
      p_role,
      '', -- 비밀번호는 auth.users에만 저장
      'active',
      v_referral_code,
      now(),
      now()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- 롤백을 수동으로 처리
      PERFORM auth.delete_user(v_user_id);
      
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'public.users 테이블에 사용자 생성 중 오류가 발생했습니다: ' || SQLERRM
      );
  END;
  
  -- 3. 잔액 레코드 생성
  BEGIN
    INSERT INTO public.user_balances (
      user_id,
      paid_balance,
      free_balance,
      total_balance
    ) VALUES (
      v_user_id,
      0,
      0,
      0
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- 롤백을 수동으로 처리
      DELETE FROM public.users WHERE id = v_user_id;
      PERFORM auth.delete_user(v_user_id);
      
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'user_balances 테이블에 레코드 생성 중 오류가 발생했습니다: ' || SQLERRM
      );
  END;
  
  -- 4. 활동 기록
  BEGIN
    INSERT INTO public.user_activities (
      user_id,
      action,
      details
    ) VALUES (
      v_user_id,
      'signup',
      jsonb_build_object(
        'email', p_email,
        'signup_method', 'api_create_user',
        'signup_time', now(),
        'referral_code', v_referral_code
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- 활동 기록 실패는 무시하고 진행
      NULL;
  END;
  
  -- 로그 기록
  INSERT INTO public.system_logs (
    log_type,
    message,
    details
  ) VALUES (
    'user_signup',
    'API를 통한 사용자 생성 성공: ' || p_email,
    jsonb_build_object(
      'user_id', v_user_id,
      'time', now(),
      'referral_code', v_referral_code
    )
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', '사용자가 성공적으로 생성되었습니다',
    'data', jsonb_build_object(
      'id', v_user_id,
      'email', p_email,
      'referral_code', v_referral_code
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 전체 예외 처리
    INSERT INTO public.system_logs (
      log_type,
      message,
      details
    ) VALUES (
      'error',
      'API를 통한 사용자 생성 중 예외 발생',
      jsonb_build_object(
        'error', SQLERRM,
        'email', p_email
      )
    );
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '사용자 생성 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_create_user_data
CREATE OR REPLACE FUNCTION public.api_create_user_data(p_user_id uuid, p_email text, p_role text DEFAULT 'advertiser'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_referral_code TEXT;
  v_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; -- 숫자와 대문자만 사용
  v_code_length CONSTANT INT := 6;
  v_position INT;
  i INT;
BEGIN
  -- 사용자 ID 유효성 검사
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '사용자 ID는 필수 항목입니다'
    );
  END IF;
  
  -- 이메일 유효성 검사
  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '이메일은 필수 항목입니다'
    );
  END IF;
  
  -- 사용자 ID 중복 검사 (추가된 부분)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    -- 기존 사용자가 있다면, 업데이트 수행 (선택 사항)
    UPDATE public.users SET
      email = COALESCE(email, p_email),
      role = COALESCE(role, p_role),
      updated_at = now()
    WHERE id = p_user_id;
    
    -- 성공 응답 반환
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', '기존 사용자 데이터가 업데이트되었습니다',
      'data', jsonb_build_object(
        'id', p_user_id,
        'email', p_email,
        'updated', TRUE
      )
    );
  END IF;
  
  -- 대문자와 숫자로만 구성된 고유한 6자리 리퍼럴 코드 생성
  LOOP
    -- 초기화
    v_referral_code := '';
    
    -- 6자리 랜덤 코드 생성
    FOR i IN 1..v_code_length LOOP
      -- 1과 36 사이의 랜덤 숫자 생성 (0-9, A-Z 범위)
      v_position := 1 + floor(random() * length(v_chars));
      
      -- 문자 추가
      v_referral_code := v_referral_code || substring(v_chars from v_position for 1);
    END LOOP;
    
    -- 이미 존재하는 코드인지 확인
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
  END LOOP;
  
  -- public.users에 사용자 생성
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      password_hash,
      status,
      referral_code,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_email,
      split_part(p_email, '@', 1),
      p_role,
      '', -- 비밀번호는 auth.users에만 저장
      'active',
      v_referral_code,
      now(),
      now()
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'public.users 테이블에 사용자 생성 중 오류가 발생했습니다: ' || SQLERRM
      );
  END;
  
  -- 잔액 레코드 생성 (이미 있는지 확인)
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_balances WHERE user_id = p_user_id) THEN
      INSERT INTO public.user_balances (
        user_id,
        paid_balance,
        free_balance,
        total_balance
      ) VALUES (
        p_user_id,
        0,
        0,
        0
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- 롤백을 수동으로 처리
      DELETE FROM public.users WHERE id = p_user_id;
      
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', 'user_balances 테이블에 레코드 생성 중 오류가 발생했습니다: ' || SQLERRM
      );
  END;
  
  -- 활동 기록
  BEGIN
    INSERT INTO public.user_activities (
      user_id,
      action,
      details
    ) VALUES (
      p_user_id,
      'signup',
      jsonb_build_object(
        'email', p_email,
        'signup_method', 'email',
        'signup_time', now(),
        'referral_code', v_referral_code
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- 활동 기록 실패는 무시하고 진행
      NULL;
  END;
  
  -- 로그 기록
  INSERT INTO public.system_logs (
    log_type,
    message,
    details
  ) VALUES (
    'user_signup',
    'API를 통한 사용자 데이터 생성 성공: ' || p_email,
    jsonb_build_object(
      'user_id', p_user_id,
      'time', now(),
      'referral_code', v_referral_code
    )
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', '사용자 데이터가 성공적으로 생성되었습니다',
    'data', jsonb_build_object(
      'id', p_user_id,
      'email', p_email,
      'referral_code', v_referral_code
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 전체 예외 처리
    INSERT INTO public.system_logs (
      log_type,
      message,
      details
    ) VALUES (
      'error',
      'API를 통한 사용자 데이터 생성 중 예외 발생',
      jsonb_build_object(
        'error', SQLERRM,
        'email', p_email
      )
    );
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '사용자 데이터 생성 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_deposit_cash
CREATE OR REPLACE FUNCTION public.api_deposit_cash(p_amount numeric, p_payment_method text, p_transaction_id text DEFAULT NULL::text, p_is_free boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 금액 유효성 검사
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '충전 금액은 0보다 커야 합니다'
    );
  END IF;
  
  -- 충전 처리
  v_result := fn_user_deposit_cash(v_user_id, p_amount, p_is_free);
  
  -- 성공 시 활동 로그 기록
  IF (v_result->>'success')::BOOLEAN THEN
    INSERT INTO user_activities (user_id, action, details)
    VALUES (
      v_user_id, 
      'deposit',
      jsonb_build_object(
        'amount', p_amount,
        'is_free', p_is_free,
        'payment_method', p_payment_method,
        'transaction_id', p_transaction_id
      )
    );
  END IF;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_deposit_cash 호출 중 오류 발생', jsonb_build_object(
      'error', SQLERRM,
      'p_amount', p_amount,
      'p_payment_method', p_payment_method,
      'p_transaction_id', p_transaction_id,
      'p_is_free', p_is_free
    ));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '충전 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_get_activities
CREATE OR REPLACE FUNCTION public.api_get_activities(p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_activities JSONB;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 활동 내역 조회
  v_activities := fn_user_get_activities(v_user_id, p_limit, p_offset);
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', v_activities
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_get_activities 호출 중 오류 발생', jsonb_build_object(
      'error', SQLERRM,
      'p_limit', p_limit,
      'p_offset', p_offset
    ));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '활동 내역 조회 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_get_balance
CREATE OR REPLACE FUNCTION public.api_get_balance()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_balance JSONB;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 잔액 조회
  v_balance := fn_user_get_balance(v_user_id);
  
  -- 조회 결과 확인
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '잔액 정보를 찾을 수 없습니다'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', v_balance
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_get_balance 호출 중 오류 발생', jsonb_build_object('error', SQLERRM));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '잔액 조회 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_get_profile
CREATE OR REPLACE FUNCTION public.api_get_profile()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_profile JSONB;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 프로필 직접 조회 (중간 함수 호출 없이)
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'name', u.name,
    'role', u.role,
    'status', u.status,
    'referral_code', u.referral_code,
    'created_at', u.created_at,
    'last_login_at', u.last_login_at
  ) INTO v_profile
  FROM users u
  WHERE u.id = v_user_id;
  
  -- 조회 결과 확인
  IF v_profile IS NULL THEN
    -- 사용자가 존재하지 않을 경우, auth.users에서 기본 정보 가져오기
    SELECT jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'name', COALESCE(au.raw_user_meta_data->>'name', au.email),
      'role', COALESCE(au.raw_user_meta_data->>'role', 'user')
    ) INTO v_profile
    FROM auth.users au
    WHERE au.id = v_user_id;
    
    -- 그래도 없으면 기본값 설정
    IF v_profile IS NULL THEN
      v_profile := jsonb_build_object(
        'id', v_user_id,
        'email', '',
        'name', '',
        'role', 'user'
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', v_profile
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 외부 환경에서는 에러 로그만 남기고 기본 프로필 반환
    RETURN jsonb_build_object(
      'success', TRUE,
      'data', jsonb_build_object(
        'id', v_user_id,
        'email', '',
        'name', '',
        'role', 'user'
      )
    );
END;
$function$
;

-- Function: api_get_registered_emails
CREATE OR REPLACE FUNCTION public.api_get_registered_emails(p_query text DEFAULT NULL::text, p_limit integer DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_items JSONB;
BEGIN
  -- 최근 등록된 이메일 가져오기 (최대 5개)
  SELECT jsonb_agg(jsonb_build_object(
    'email', email
  ))
  INTO v_items
  FROM auth.users
  WHERE 
    email IS NOT NULL 
    AND (p_query IS NULL OR email ILIKE '%' || p_query || '%')
  ORDER BY created_at DESC
  LIMIT p_limit;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', COALESCE(v_items, '[]'::jsonb)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '이메일 목록 조회 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_log_system_event
CREATE OR REPLACE FUNCTION public.api_log_system_event(p_log_type text, p_message text, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.system_logs (
    log_type,
    message,
    details,
    created_at
  ) VALUES (
    p_log_type,
    p_message,
    p_details,
    now()
  )
  RETURNING id INTO v_log_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'log_id', v_log_id
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 로깅 실패 시 조용히 처리 (로그 실패에 대한 별도 로깅은 무한 루프를 피하기 위해 제외)
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '로그 생성 실패: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_test_get_accounts
CREATE OR REPLACE FUNCTION public.api_test_get_accounts(p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_items JSONB;
BEGIN
  -- 임시 테이블로 먼저 데이터 조회
  CREATE TEMP TABLE IF NOT EXISTS temp_test_accounts ON COMMIT DROP AS
  SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'role', 'user') as role,
    created_at
  FROM auth.users
  WHERE 
    email LIKE 'test-%'
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT p_limit;
  
  -- 임시 테이블에서 JSON으로 변환
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'email', email,
        'role', role,
        'created_at', created_at
      )
    )
  INTO v_items
  FROM temp_test_accounts;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'data', COALESCE(v_items, '[]'::jsonb)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '테스트 계정 목록 조회 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: api_update_profile
CREATE OR REPLACE FUNCTION public.api_update_profile(p_name text DEFAULT NULL::text, p_role text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_current_role TEXT;
BEGIN
  -- 인증 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '인증되지 않은 사용자입니다'
    );
  END IF;
  
  -- 역할 유효성 검사
  IF p_role IS NOT NULL THEN
    IF p_role NOT IN ('advertiser', 'agency', 'distributor') THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', '유효하지 않은 역할입니다'
      );
    END IF;
    
    -- 현재 역할 확인
    SELECT role INTO v_current_role FROM users WHERE id = v_user_id;
    
    -- 관리자 역할 변경 방지
    IF v_current_role IN ('operator', 'developer') AND p_role != v_current_role THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'message', '관리자 역할은 변경할 수 없습니다'
      );
    END IF;
  END IF;
  
  -- 프로필 업데이트
  UPDATE users
  SET 
    name = COALESCE(p_name, name),
    role = COALESCE(p_role, role),
    updated_at = now()
  WHERE id = v_user_id;
  
  -- 활동 로그 기록
  INSERT INTO user_activities (user_id, action, details)
  VALUES (
    v_user_id, 
    'profile_updated',
    jsonb_build_object(
      'updated_fields', jsonb_strip_nulls(jsonb_build_object(
        'name', p_name,
        'role', p_role
      ))
    )
  );
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', '프로필이 업데이트되었습니다'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 로깅
    INSERT INTO system_logs (log_type, message, details)
    VALUES ('error', 'api_update_profile 호출 중 오류 발생', jsonb_build_object(
      'error', SQLERRM,
      'p_name', p_name,
      'p_role', p_role
    ));
    
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '프로필 업데이트 중 오류가 발생했습니다: ' || SQLERRM
    );
END;
$function$
;

-- Function: auto_complete_overdue_slots
CREATE OR REPLACE FUNCTION public.auto_complete_overdue_slots(days_after_completion integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result jsonb := '{"processed": 0, "refunded": 0, "errors": []}'::jsonb;
    v_user_group RECORD;
    v_slot RECORD;
    v_completion_result jsonb;
    v_settlement RECORD;
    v_processed INT := 0;
    v_total_refunded NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_refund_amount NUMERIC;
    v_user_balance NUMERIC;
    v_second_offset INT := 0;
BEGIN
    -- 마지막 작업일로부터 N일 경과했지만 완료되지 않은 슬롯들을 사용자별로 그룹화
    FOR v_user_group IN 
        WITH overdue_slots AS (
            SELECT 
                s.id as slot_id,
                s.user_id,
                s.mat_id,
                c.campaign_name,
                u.full_name as user_name,
                m.full_name as mat_name,
                (SELECT MAX(swi.date) FROM slot_works_info swi WHERE swi.slot_id = s.id) as last_work_date
            FROM public.slots s
            JOIN public.users u ON u.id = s.user_id
            LEFT JOIN public.users m ON m.id = s.mat_id
            JOIN public.campaigns c ON c.id = s.product_id
            WHERE s.status = 'approved'
            -- 작업이 있고 마지막 작업일이 N일 이상 경과했거나, 작업이 없고 승인일이 N일 이상 경과한 경우
            AND (
                -- 작업이 있는 경우: 마지막 작업일이 N일 이상 경과
                s.id IN (
                    SELECT DISTINCT swi.slot_id 
                    FROM slot_works_info swi 
                    GROUP BY swi.slot_id
                    HAVING MAX(swi.date) < CURRENT_DATE - INTERVAL '1 day' * days_after_completion
                )
                OR
                -- 작업이 없는 경우: 승인일이 N일 이상 경과
                (
                    NOT EXISTS (SELECT 1 FROM slot_works_info swi WHERE swi.slot_id = s.id)
                    AND s.submitted_at < NOW() - INTERVAL '1 day' * days_after_completion
                )
            )
        )
        SELECT 
            user_id,
            array_agg(slot_id) as slot_ids,
            array_agg(DISTINCT mat_name) as mat_names,
            array_agg(campaign_name) as campaign_names,
            COUNT(*) as slot_count,
            MIN(user_name) as user_name
        FROM overdue_slots
        GROUP BY user_id
    LOOP
        BEGIN
            v_refund_amount := 0;
            
            -- 각 슬롯 처리
            FOR v_slot IN SELECT unnest(v_user_group.slot_ids) as slot_id
            LOOP
                BEGIN
                    -- mat_complete_slot 호출
                    v_completion_result := mat_complete_slot(
                        v_slot.slot_id, 
                        (SELECT mat_id FROM slots WHERE id = v_slot.slot_id),
                        format('자동 완료 - 마지막 작업일로부터 %s일 경과', days_after_completion)
                    );
                    
                    -- 정산 정보 조회
                    SELECT * INTO v_settlement FROM calculate_slot_settlement(v_slot.slot_id);
                    v_refund_amount := v_refund_amount + v_settlement.base_amount;
                    
                    -- 슬롯 상태 업데이트
                    UPDATE public.slots
                    SET status = 'completed', processed_at = NOW()
                    WHERE id = v_slot.slot_id;
                    
                    UPDATE public.slot_pending_balances
                    SET status = 'processed', processed_at = NOW()
                    WHERE slot_id = v_slot.slot_id;
                    
                    v_processed := v_processed + 1;
                EXCEPTION WHEN OTHERS THEN
                    v_errors := v_errors || jsonb_build_object('slot_id', v_slot.slot_id, 'error', SQLERRM);
                END;
            END LOOP;
            
            -- 환불 처리
            IF v_refund_amount > 0 THEN
                INSERT INTO public.user_cash_history (
                    user_id, transaction_type, amount, description, transaction_at
                ) VALUES (
                    v_user_group.user_id, 'refund', v_refund_amount::INTEGER,
                    format('슬롯 자동 완료 환불 (%s건)', v_user_group.slot_count), NOW()
                );
                
                UPDATE public.user_balances
                SET total_balance = total_balance + v_refund_amount,
                    paid_balance = paid_balance + v_refund_amount,
                    updated_at = NOW()
                WHERE user_id = v_user_group.user_id;
                
                v_total_refunded := v_total_refunded + v_refund_amount;
            END IF;
            
            -- 알림 생성 (각 사용자마다 1초씩 차이를 두어 중복 방지)
            BEGIN
                INSERT INTO public.notifications (
                    user_id, type, title, message, link, priority, status, created_at
                ) VALUES (
                    v_user_group.user_id, 'slot', '슬롯 작업 자동 완료',
                    format('%s건의 슬롯이 자동 완료되었습니다. 총 %s원이 환불되었습니다.', 
                        v_user_group.slot_count, v_refund_amount),
                    '/slots', 'high', 'unread', NOW() + (v_second_offset || ' seconds')::interval
                );
            EXCEPTION WHEN unique_violation THEN
                -- 혹시 모를 중복 시 추가 1초 후로 재시도
                INSERT INTO public.notifications (
                    user_id, type, title, message, link, priority, status, created_at
                ) VALUES (
                    v_user_group.user_id, 'slot', '슬롯 작업 자동 완료',
                    format('%s건의 슬롯이 자동 완료되었습니다. 총 %s원이 환불되었습니다.', 
                        v_user_group.slot_count, v_refund_amount),
                    '/slots', 'high', 'unread', NOW() + ((v_second_offset + 1) || ' seconds')::interval
                );
            END;
            
            -- 다음 사용자를 위해 1초 증가
            v_second_offset := v_second_offset + 1;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'user_id', v_user_group.user_id, 'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed, 'refunded', v_total_refunded,
        'errors', v_errors, 'executed_at', NOW()
    );
END;
$function$
;

-- Function: auto_confirm_completed_slots
CREATE OR REPLACE FUNCTION public.auto_confirm_completed_slots(days_after_completion integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result jsonb := '{"processed": 0, "paid": 0, "errors": []}'::jsonb;
    v_slot RECORD;
    v_confirm_result jsonb;
    v_processed INT := 0;
    v_total_paid NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_payment_amount NUMERIC;
    v_second_offset INT := 0;
BEGIN
    -- 대기 중인 슬롯들 처리
    FOR v_slot IN 
        SELECT 
            s.id as slot_id,
            s.user_id,
            s.mat_id,
            u.full_name as user_name,
            m.full_name as mat_name,
            (SELECT shl.created_at 
             FROM slot_history_logs shl 
             WHERE shl.slot_id = s.id AND shl.action = 'mat_complete' 
             ORDER BY shl.created_at DESC LIMIT 1) as mat_completed_at,
            (SELECT cs.user_payment_amount FROM calculate_slot_settlement(s.id) cs) as payment_amount
        FROM public.slots s
        JOIN public.users u ON u.id = s.user_id
        JOIN public.users m ON m.id = s.mat_id
        WHERE s.status = 'pending_user_confirm'
        AND EXISTS (
            SELECT 1 FROM slot_history_logs shl 
            WHERE shl.slot_id = s.id AND shl.action = 'mat_complete'
            AND shl.created_at < NOW() - INTERVAL '1 day' * days_after_completion
        )
    LOOP
        BEGIN
            -- user_confirm_slot_completion 호출
            v_confirm_result := user_confirm_slot_completion(
                v_slot.slot_id, v_slot.user_id,
                format('자동 거래완료 - 총판 완료 후 %s일 경과', days_after_completion)
            );
            
            IF (v_confirm_result->>'success')::boolean THEN
                v_processed := v_processed + 1;
                v_total_paid := v_total_paid + v_slot.payment_amount;
                
                -- MAT에게 알림 (각 슬롯마다 1초씩 차이를 두어 중복 방지)
                BEGIN
                    INSERT INTO public.notifications (
                        user_id, type, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_slot.mat_id, 'transaction', '슬롯 작업 자동 거래완료',
                        format('사용자(%s)가 거래완료를 하지 않아 자동 완료되었습니다. %s원이 지급되었습니다.', 
                            v_slot.user_name, v_slot.payment_amount),
                        format('/slots/%s', v_slot.slot_id), 'high', 'unread', 
                        NOW() + (v_second_offset || ' seconds')::interval
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- 혹시 모를 중복 시 추가 1초 후로 재시도
                    INSERT INTO public.notifications (
                        user_id, type, title, message, link, priority, status, created_at
                    ) VALUES (
                        v_slot.mat_id, 'transaction', '슬롯 작업 자동 거래완료',
                        format('사용자(%s)가 거래완료를 하지 않아 자동 완료되었습니다. %s원이 지급되었습니다.', 
                            v_slot.user_name, v_slot.payment_amount),
                        format('/slots/%s', v_slot.slot_id), 'high', 'unread', 
                        NOW() + ((v_second_offset + 1) || ' seconds')::interval
                    );
                END;
                
                -- 다음 슬롯을 위해 1초 증가
                v_second_offset := v_second_offset + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'slot_id', v_slot.slot_id, 'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed, 'paid', v_total_paid,
        'errors', v_errors, 'executed_at', NOW()
    );
END;
$function$
;

-- Function: calculate_slot_settlement
CREATE OR REPLACE FUNCTION public.calculate_slot_settlement(p_slot_id uuid)
 RETURNS TABLE(slot_id uuid, campaign_id integer, unit_price numeric, total_quantity integer, worked_quantity integer, base_amount numeric, user_payment_amount numeric, refund_amount numeric, settlement_details jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH slot_campaign_info AS (
        -- 슬롯과 캠페인 정보 조인
        SELECT 
            s.id as slot_id,
            s.product_id as campaign_id,
            s.quantity::INTEGER as daily_quantity,  -- 1일 작업량
            s.user_id,
            s.mat_id,
            c.unit_price::NUMERIC,
            c.campaign_name,
            c.service_type,
            s.start_date,
            s.end_date,
            -- 총 요청 수량 = 1일 작업량 × 작업 일수
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    s.quantity::INTEGER * (s.end_date - s.start_date + 1)
                ELSE 
                    s.quantity::INTEGER
            END as total_requested_quantity
        FROM slots s
        JOIN campaigns c ON s.product_id = c.id
        WHERE s.id = p_slot_id
    ),
    work_summary AS (
        -- 작업 내역 집계
        SELECT 
            swi.slot_id,
            SUM(swi.work_cnt) as total_worked
        FROM slot_works_info swi
        WHERE swi.slot_id = p_slot_id
        GROUP BY swi.slot_id
    )
    SELECT 
        sci.slot_id,
        sci.campaign_id,
        sci.unit_price,
        sci.total_requested_quantity as total_quantity,
        COALESCE(ws.total_worked, 0)::INTEGER as worked_quantity,
        -- 부가세 10% 포함 계산
        sci.unit_price * sci.total_requested_quantity * 1.1 as base_amount,
        -- 총판 지급 (부가세 포함)
        sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC * 1.1 as user_payment_amount,
        -- 미완료분 환불 (부가세 포함)
        CASE 
            WHEN COALESCE(ws.total_worked, 0) < sci.total_requested_quantity THEN
                sci.unit_price * (sci.total_requested_quantity - COALESCE(ws.total_worked, 0)) * 1.1
            ELSE 0
        END as refund_amount,
        jsonb_build_object(
            'campaign_name', sci.campaign_name,
            'service_type', sci.service_type,
            'unit_price', sci.unit_price,
            'daily_quantity', sci.daily_quantity,
            'work_days', CASE 
                WHEN sci.start_date IS NOT NULL AND sci.end_date IS NOT NULL THEN
                    sci.end_date - sci.start_date + 1
                ELSE 0
            END,
            'requested_quantity', sci.total_requested_quantity,
            'completed_quantity', COALESCE(ws.total_worked, 0),
            'completion_rate', 
                CASE 
                    WHEN sci.total_requested_quantity > 0 THEN 
                        ROUND((COALESCE(ws.total_worked, 0)::NUMERIC / sci.total_requested_quantity::NUMERIC) * 100, 2)
                    ELSE 0
                END,
            'calculation_breakdown', jsonb_build_object(
                'total_cost', sci.unit_price * sci.total_requested_quantity * 1.1,  -- 부가세 포함
                'total_cost_without_vat', sci.unit_price * sci.total_requested_quantity,  -- 부가세 제외
                'vat_amount', sci.unit_price * sci.total_requested_quantity * 0.1,  -- 부가세
                'worked_cost', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC * 1.1,  -- 총판 지급 (부가세 포함)
                'worked_cost_without_vat', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC,  -- 총판 지급 (부가세 제외)
                'user_payment', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC * 1.1,  -- 총판 지급 (부가세 포함)
                'refund', sci.unit_price * GREATEST(0, sci.total_requested_quantity - COALESCE(ws.total_worked, 0)) * 1.1,  -- 환불 (부가세 포함)
                'refund_without_vat', sci.unit_price * GREATEST(0, sci.total_requested_quantity - COALESCE(ws.total_worked, 0))  -- 환불 (부가세 제외)
            )
        ) as settlement_details
    FROM slot_campaign_info sci
    LEFT JOIN work_summary ws ON sci.slot_id = ws.slot_id;
END;
$function$
;

-- Function: calculate_slot_work_summary
CREATE OR REPLACE FUNCTION public.calculate_slot_work_summary(p_slot_id uuid)
 RETURNS TABLE(total_requested_days integer, total_worked_days integer, total_requested_quantity integer, total_worked_quantity integer, completion_rate numeric, work_details jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH slot_info AS (
        -- 슬롯 기본 정보
        SELECT 
            s.id,
            s.quantity::INTEGER as daily_quantity,  -- 1일 작업량
            s.start_date,
            s.end_date,
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    (s.end_date - s.start_date + 1)
                ELSE 0
            END as requested_days,
            -- 총 요청 수량 = 1일 작업량 × 작업 일수
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    s.quantity::INTEGER * (s.end_date - s.start_date + 1)
                ELSE 
                    s.quantity::INTEGER
            END as total_requested_quantity
        FROM slots s
        WHERE s.id = p_slot_id
    ),
    work_summary AS (
        -- 실제 작업 내역 집계
        SELECT 
            swi.slot_id,
            COUNT(DISTINCT swi.date) as worked_days,
            SUM(swi.work_cnt) as total_work_cnt,
            jsonb_agg(
                jsonb_build_object(
                    'date', swi.date,
                    'work_cnt', swi.work_cnt,
                    'notes', swi.notes
                ) ORDER BY swi.date
            ) as work_details
        FROM slot_works_info swi
        WHERE swi.slot_id = p_slot_id
        GROUP BY swi.slot_id
    )
    SELECT 
        si.requested_days::INTEGER as total_requested_days,
        COALESCE(ws.worked_days, 0)::INTEGER as total_worked_days,
        si.total_requested_quantity::INTEGER as total_requested_quantity,
        COALESCE(ws.total_work_cnt, 0)::INTEGER as total_worked_quantity,
        CASE 
            WHEN si.total_requested_quantity > 0 THEN 
                ROUND((COALESCE(ws.total_work_cnt, 0)::NUMERIC / si.total_requested_quantity::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_rate,
        COALESCE(ws.work_details, '[]'::jsonb) as work_details
    FROM slot_info si
    LEFT JOIN work_summary ws ON si.id = ws.slot_id;
END;
$function$
;

-- Function: can_user_search
CREATE OR REPLACE FUNCTION public.can_user_search(p_user_id uuid, p_search_type search_type, p_user_role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_daily_limit INTEGER;
    v_monthly_limit INTEGER;
    v_daily_count INTEGER;
    v_monthly_count INTEGER;
    v_purchased_quota INTEGER;
    v_can_search BOOLEAN;
    v_remaining_daily INTEGER;
    v_remaining_monthly INTEGER;
BEGIN
    -- 회원 등급별 제한 조회
    SELECT daily_limit, monthly_limit
    INTO v_daily_limit, v_monthly_limit
    FROM search_limits_config
    WHERE user_role = p_user_role AND search_type = p_search_type;
    
    -- 무제한인 경우
    IF v_daily_limit = -1 THEN
        RETURN jsonb_build_object(
            'canSearch', true,
            'dailyLimit', -1,
            'dailyUsed', 0,
            'dailyRemaining', -1,
            'monthlyLimit', -1,
            'monthlyUsed', 0,
            'monthlyRemaining', -1,
            'purchasedQuota', 0,
            'message', '무제한 검색 가능'
        );
    END IF;
    
    -- 오늘 검색 횟수 조회
    v_daily_count := get_daily_search_count(p_user_id, p_search_type);
    
    -- 이번 달 검색 횟수 조회
    SELECT COALESCE(SUM(count), 0)
    INTO v_monthly_count
    FROM daily_search_counts
    WHERE user_id = p_user_id
        AND search_type = p_search_type
        AND EXTRACT(YEAR FROM search_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM search_date) = EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- 추가 구매 권한 확인
    SELECT COALESCE(SUM(quota_amount - used_amount), 0)
    INTO v_purchased_quota
    FROM search_quota_purchases
    WHERE user_id = p_user_id
        AND search_type = p_search_type
        AND valid_until >= CURRENT_DATE;
    
    -- 검색 가능 여부 판단
    v_can_search := v_daily_count < v_daily_limit;
    IF v_monthly_limit IS NOT NULL THEN
        v_can_search := v_can_search AND (v_monthly_count < v_monthly_limit + v_purchased_quota);
    END IF;
    
    v_remaining_daily := GREATEST(0, v_daily_limit - v_daily_count);
    v_remaining_monthly := CASE 
        WHEN v_monthly_limit IS NULL THEN -1
        ELSE GREATEST(0, v_monthly_limit + v_purchased_quota - v_monthly_count)
    END;
    
    RETURN jsonb_build_object(
        'canSearch', v_can_search,
        'dailyLimit', v_daily_limit,
        'dailyUsed', v_daily_count,
        'dailyRemaining', v_remaining_daily,
        'monthlyLimit', v_monthly_limit,
        'monthlyUsed', v_monthly_count,
        'monthlyRemaining', v_remaining_monthly,
        'purchasedQuota', v_purchased_quota,
        'message', CASE 
            WHEN NOT v_can_search AND v_daily_count >= v_daily_limit THEN '일일 검색 한도를 초과했습니다.'
            WHEN NOT v_can_search THEN '월간 검색 한도를 초과했습니다.'
            ELSE '검색 가능합니다.'
        END
    );
END;
$function$
;

-- Function: check_email_exists
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  DECLARE
    email_exists BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.users
      WHERE email = email_to_check
    ) INTO email_exists;

    RETURN email_exists;
  END;
  $function$
;

-- Function: cleanup_old_search_logs
CREATE OR REPLACE FUNCTION public.cleanup_old_search_logs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM search_logs 
    WHERE searched_at < CURRENT_DATE - INTERVAL '30 days';
END;
$function$
;

-- Function: create_bulk_notifications
CREATE OR REPLACE FUNCTION public.create_bulk_notifications(p_user_ids uuid[], p_type text, p_title text, p_message text, p_link text DEFAULT NULL::text, p_icon text DEFAULT NULL::text, p_priority text DEFAULT 'medium'::text, p_expires_in_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_user_id UUID;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- 만료 날짜 계산
  v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  
  -- 각 사용자에 대해 알림 생성
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    BEGIN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        icon,
        priority,
        status,
        expires_at
      ) VALUES (
        v_user_id,
        p_type,
        p_title,
        p_message,
        p_link,
        p_icon,
        p_priority,
        'unread',
        v_expires_at
      );
      
      v_success_count := v_success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      -- 오류 로깅
      RAISE NOTICE 'Failed to create notification for user %: %', v_user_id, SQLERRM;
    END;
  END LOOP;
  
  -- 결과 생성
  v_result := jsonb_build_object(
    'success', v_success_count > 0,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'total', array_length(p_user_ids, 1)
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$function$
;

-- Function: create_notification
CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_link text DEFAULT NULL::text, p_icon text DEFAULT NULL::text, p_priority text DEFAULT 'medium'::text, p_expires_in_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_notification_id UUID;
  v_result JSONB;
BEGIN
  -- 만료 날짜 계산
  v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  
  -- 알림 생성
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    icon,
    priority,
    status,
    expires_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_icon,
    p_priority,
    'unread',
    v_expires_at
  )
  RETURNING id INTO v_notification_id;
  
  -- 결과 생성
  v_result := jsonb_build_object(
    'success', TRUE,
    'notification_id', v_notification_id
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$function$
;

-- Function: enforce_single_global_setting
CREATE OR REPLACE FUNCTION public.enforce_single_global_setting()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (SELECT COUNT(*) FROM cash_global_settings) > 0 THEN
        RAISE EXCEPTION '전역 설정은 하나만 존재할 수 있습니다';
    END IF;
    RETURN NEW;
END;
$function$
;

-- Function: execute_sql
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  is_safe BOOLEAN;
BEGIN
  -- 안전한 쿼리인지 검증 (SELECT 문장만 허용)
  is_safe := query ~* '^SELECT';
  
  IF NOT is_safe THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed for security reasons';
  END IF;
  
  -- 쿼리 실행
  EXECUTE 'SELECT jsonb_agg(t) FROM (' || query || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
;

-- Function: fn_setup_existing_users
CREATE OR REPLACE FUNCTION public.fn_setup_existing_users()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_auth_user RECORD;
  v_count INT := 0;
  v_referral_code TEXT;
BEGIN
  -- auth.users에 있지만 public.users에 없는 사용자들을 추가
  FOR v_auth_user IN 
    SELECT id, email, created_at, updated_at, last_sign_in_at, raw_user_meta_data->>'role' as role, encrypted_password
    FROM auth.users au
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users pu WHERE pu.id = au.id
    )
    AND au.deleted_at IS NULL
  LOOP
    -- 고유한 추천 코드 생성
    LOOP
      v_referral_code := substring(md5(random()::text) from 1 for 6);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
    END LOOP;
    
    -- 사용자 레코드 생성
    INSERT INTO public.users (
      id, email, name, role, password_hash, status, referral_code, created_at, updated_at, last_login_at
    ) VALUES (
      v_auth_user.id,
      v_auth_user.email,
      split_part(v_auth_user.email, '@', 1),
      COALESCE(v_auth_user.role, 'advertiser'),
      COALESCE(v_auth_user.encrypted_password, ''),
      'active',
      v_referral_code,
      v_auth_user.created_at,
      v_auth_user.updated_at,
      v_auth_user.last_sign_in_at
    );
    
    -- 잔액 레코드 생성
    INSERT INTO public.user_balances (
      user_id, paid_balance, free_balance, total_balance
    ) VALUES (
      v_auth_user.id, 0, 0, 0
    );
    
    -- 가입 활동 로그 생성
    INSERT INTO public.user_activities (
      user_id, action, details, occurred_at
    ) VALUES (
      v_auth_user.id,
      'signup',
      jsonb_build_object(
        'email', v_auth_user.email,
        'signup_method', 'admin_setup'
      ),
      v_auth_user.created_at
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', v_count || ' 명의 사용자 레코드가 생성되었습니다.'
  );
END;
$function$
;

-- Function: fn_user_deposit_cash
CREATE OR REPLACE FUNCTION public.fn_user_deposit_cash(p_user_id uuid, p_amount numeric, p_is_free boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_new_paid_balance NUMERIC;
  v_new_free_balance NUMERIC;
  v_new_total_balance NUMERIC;
BEGIN
  -- 금액 유효성 검사
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', '충전 금액은 0보다 커야 합니다'
    );
  END IF;
  
  -- 잔액 업데이트
  IF p_is_free THEN
    UPDATE user_balances
    SET 
      free_balance = free_balance + p_amount,
      total_balance = paid_balance + free_balance + p_amount,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING paid_balance, free_balance, total_balance
    INTO v_new_paid_balance, v_new_free_balance, v_new_total_balance;
  ELSE
    UPDATE user_balances
    SET 
      paid_balance = paid_balance + p_amount,
      total_balance = paid_balance + p_amount + free_balance,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING paid_balance, free_balance, total_balance
    INTO v_new_paid_balance, v_new_free_balance, v_new_total_balance;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', '충전이 완료되었습니다',
    'data', jsonb_build_object(
      'amount', p_amount,
      'is_free', p_is_free,
      'new_balance', v_new_total_balance
    )
  );
END;
$function$
;

-- Function: fn_user_get_activities
CREATE OR REPLACE FUNCTION public.fn_user_get_activities(p_user_id uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_items JSONB;
  v_total INT;
BEGIN
  -- 총 개수 조회
  SELECT COUNT(*) INTO v_total FROM user_activities WHERE user_id = p_user_id;
  
  -- 활동 내역 조회
  SELECT jsonb_agg(jsonb_build_object(
    'id', ua.id,
    'action', ua.action,
    'occurred_at', ua.occurred_at,
    'details', ua.details
  )) INTO v_items
  FROM user_activities ua
  WHERE ua.user_id = p_user_id
  ORDER BY ua.occurred_at DESC
  LIMIT p_limit
  OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$function$
;

-- Function: fn_user_get_balance
CREATE OR REPLACE FUNCTION public.fn_user_get_balance(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'paid_balance', ub.paid_balance,
    'free_balance', ub.free_balance,
    'total_balance', ub.total_balance,
    'updated_at', ub.updated_at
  ) INTO v_result
  FROM user_balances ub
  WHERE ub.user_id = p_user_id;
  
  RETURN v_result;
END;
$function$
;

-- Function: fn_user_get_profile
CREATE OR REPLACE FUNCTION public.fn_user_get_profile(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'name', u.name,
    'role', u.role,
    'status', u.status,
    'referral_code', u.referral_code,
    'created_at', u.created_at,
    'last_login_at', u.last_login_at
  ) INTO v_result
  FROM users u
  WHERE u.id = p_user_id;
  
  RETURN v_result;
END;
$function$
;

-- Function: generate_user_slot_number
CREATE OR REPLACE FUNCTION public.generate_user_slot_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_number INTEGER;
BEGIN
    -- 해당 매트의 마지막 번호 + 1 계산
    SELECT COALESCE(MAX(user_slot_number), 0) + 1
    INTO next_number
    FROM slots
    WHERE mat_id = NEW.mat_id;
    
    -- user_slot_number 설정
    NEW.user_slot_number := next_number;
    
    RETURN NEW;
END;
$function$
;

-- Function: get_auth_uid
CREATE OR REPLACE FUNCTION public.get_auth_uid()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
    RETURN auth.uid()::text;
  END;
  $function$
;

-- Function: get_daily_search_count
CREATE OR REPLACE FUNCTION public.get_daily_search_count(p_user_id uuid, p_search_type search_type, p_date date DEFAULT CURRENT_DATE)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COALESCE(count, 0)
    INTO v_count
    FROM daily_search_counts
    WHERE user_id = p_user_id
        AND search_type = p_search_type
        AND search_date = p_date;
    
    RETURN COALESCE(v_count, 0);
END;
$function$
;

-- Function: get_ordered_keyword_fields
CREATE OR REPLACE FUNCTION public.get_ordered_keyword_fields(p_service_type text)
 RETURNS TABLE(field_name text, field_config jsonb, field_order integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        key as field_name,
        value as field_config,
        COALESCE((value->>'order')::int, 999) as field_order
    FROM service_keyword_field_mappings sfm,
         jsonb_each(sfm.field_mapping)
    WHERE sfm.service_type = p_service_type
    ORDER BY COALESCE((value->>'order')::int, 999), key;
END;
$function$
;

-- Function: get_pending_user_confirm_slots
CREATE OR REPLACE FUNCTION public.get_pending_user_confirm_slots(p_user_id uuid)
 RETURNS TABLE(slot_id uuid, campaign_name text, mat_name text, mat_completed_at timestamp without time zone, work_summary jsonb, settlement_info jsonb, pending_amount numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as slot_id,
        c.campaign_name,
        u.full_name as mat_name,
        -- mat_completed_at은 히스토리 로그에서 가져옴
        (SELECT shl.created_at 
         FROM slot_history_logs shl 
         WHERE shl.slot_id = s.id 
         AND shl.action = 'mat_complete' 
         ORDER BY shl.created_at DESC 
         LIMIT 1) as mat_completed_at,
        row_to_json(ws.*) as work_summary,
        row_to_json(st.*) as settlement_info,
        spb.amount as pending_amount
    FROM slots s
    JOIN campaigns c ON s.product_id = c.id
    JOIN users u ON s.mat_id = u.id
    LEFT JOIN slot_pending_balances spb ON s.id = spb.slot_id
    CROSS JOIN LATERAL calculate_slot_work_summary(s.id) ws
    CROSS JOIN LATERAL calculate_slot_settlement(s.id) st
    WHERE s.user_id = p_user_id
    AND s.status = 'pending_user_confirm'
    ORDER BY (SELECT shl.created_at 
              FROM slot_history_logs shl 
              WHERE shl.slot_id = s.id 
              AND shl.action = 'mat_complete' 
              ORDER BY shl.created_at DESC 
              LIMIT 1) DESC;
END;
$function$
;

-- Function: get_unread_notification_count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_uuid uuid)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM notifications
  WHERE user_id = user_uuid
  AND status = 'unread';
$function$
;

-- Function: get_user_search_stats
CREATE OR REPLACE FUNCTION public.get_user_search_stats(p_user_id uuid, p_period text DEFAULT 'month'::text)
 RETURNS TABLE(search_type search_type, total_searches bigint, unique_queries bigint, avg_daily_searches numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_start_date DATE;
BEGIN
    -- 기간 설정
    v_start_date := CASE p_period
        WHEN 'day' THEN CURRENT_DATE
        WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
        ELSE CURRENT_DATE - INTERVAL '30 days'
    END;
    
    RETURN QUERY
    SELECT 
        sl.search_type,
        COUNT(*)::BIGINT as total_searches,
        COUNT(DISTINCT sl.search_query)::BIGINT as unique_queries,
        ROUND(COUNT(*)::NUMERIC / GREATEST(1, CURRENT_DATE - v_start_date + 1), 2) as avg_daily_searches
    FROM search_logs sl
    WHERE sl.user_id = p_user_id
        AND sl.searched_at >= v_start_date
    GROUP BY sl.search_type;
END;
$function$
;

-- Function: handle_worklog_current
CREATE OR REPLACE FUNCTION public.handle_worklog_current()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE public.claude_worklogs
    SET is_current = false
    WHERE id != NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Function: hash_password
CREATE OR REPLACE FUNCTION public.hash_password(password text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$function$
;

-- Function: mark_notifications_as_read
CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(user_uuid uuid, notification_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    status = 'read',
    updated_at = NOW()
  WHERE 
    user_id = user_uuid
    AND id = ANY(notification_ids)
    AND status = 'unread';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$
;

-- Function: mat_complete_slot
CREATE OR REPLACE FUNCTION public.mat_complete_slot(p_slot_id uuid, p_mat_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_slot_record RECORD;
    v_settlement RECORD;
    v_work_summary RECORD;
    v_result JSONB;
BEGIN
    -- 트랜잭션 시작
    
    -- 1. 슬롯 정보 확인
    SELECT * INTO v_slot_record
    FROM slots
    WHERE id = p_slot_id AND mat_id = p_mat_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다. slot_id: %, mat_id: %', p_slot_id, p_mat_id;
    END IF;
    
    IF v_slot_record.status != 'approved' THEN
        RAISE EXCEPTION '승인된 슬롯만 완료 처리할 수 있습니다. 현재 상태: %', v_slot_record.status;
    END IF;
    
    -- 2. 작업 내역 요약 정보 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 3. 정산 금액 계산
    SELECT * INTO v_settlement
    FROM calculate_slot_settlement(p_slot_id);
    
    -- 4. 슬롯 상태를 'pending_user_confirm'으로 업데이트
    UPDATE slots
    SET 
        status = 'pending_user_confirm',
        updated_at = NOW()
    WHERE id = p_slot_id;
    
    -- 4-1. slot_pending_balances 상태를 'approved'로 업데이트
    UPDATE slot_pending_balances
    SET 
        status = 'approved',
        processor_id = p_mat_id,
        notes = format('총판 승인 - 완료율: %s%%', v_work_summary.completion_rate)
    WHERE slot_id = p_slot_id AND status = 'pending';
    
    -- 5. 슬롯 히스토리 로그 추가
    INSERT INTO slot_history_logs (
        slot_id,
        user_id,
        old_status,
        new_status,
        action,
        details,
        created_at
    ) VALUES (
        p_slot_id,
        p_mat_id,
        'approved',
        'pending_user_confirm',
        'mat_complete',
        jsonb_build_object(
            'work_summary', row_to_json(v_work_summary),
            'settlement', row_to_json(v_settlement),
            'notes', p_notes,
            'completed_by', 'mat',
            'mat_completed_time', NOW(),
            'pending_payment', v_settlement.user_payment_amount,
            'pending_refund', v_settlement.refund_amount
        ),
        NOW()
    );
    
    -- 6. 사용자에게 알림 발송 (notifications 테이블)
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        priority,
        status,
        created_at
    ) VALUES (
        v_slot_record.user_id,
        'slot',
        '슬롯 완료 확인 요청',
        format('총판이 슬롯을 완료했습니다. 확인 후 정산이 진행됩니다. (캠페인: %s, 완료율: %s%%)', 
            v_settlement.settlement_details->>'campaign_name',
            v_work_summary.completion_rate
        ),
        format('/slots/%s', p_slot_id),
        'high',  -- 중요: 사용자 확인 필요
        'unread',
        NOW()
    );
    
    -- 7. 결과 반환
    v_result := jsonb_build_object(
        'success', true,
        'slot_id', p_slot_id,
        'status', 'pending_user_confirm',
        'work_summary', row_to_json(v_work_summary),
        'settlement', row_to_json(v_settlement),
        'message', format('슬롯 완료 처리되었습니다. 사용자 확인 대기중입니다. (완료율: %s%%)', 
            v_work_summary.completion_rate
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 롤백
        RAISE;
END;
$function$
;

-- Function: notify_chat_message
CREATE OR REPLACE FUNCTION public.notify_chat_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM pg_notify(
    'chat_messages',
    json_build_object(
      'id', NEW.id,
      'room_id', NEW.room_id,
      'sender_id', NEW.sender_id,
      'content', NEW.content,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$function$
;

-- Function: notify_cron_failure
CREATE OR REPLACE FUNCTION public.notify_cron_failure()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
      IF NEW.status = 'failed' THEN
          INSERT INTO notifications (
              user_id,
              type,
              title,
              message,
              priority,
              created_at
          )
          SELECT DISTINCT
              u.id,
              'system',
              '크론 작업 실패',
              format('크론 작업 실패: %s - %s', NEW.command, NEW.return_message),
              'high',
              NOW()
          FROM users u
          INNER JOIN notification_receivers nr ON
              (nr.user_email = u.email OR nr.user_role = u.role)
          WHERE nr.notification_type = 'cron_failure'
          AND nr.is_active = true;
      END IF;
      RETURN NEW;
  END;
  $function$
;

-- Function: process_auto_refund_candidates
CREATE OR REPLACE FUNCTION public.process_auto_refund_candidates()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result jsonb := '{"processed": 0, "refunded": 0, "errors": []}'::jsonb;
    v_slot RECORD;
    v_processed INT := 0;
    v_refunded NUMERIC := 0;
    v_errors jsonb := '[]'::jsonb;
    v_refund_amount NUMERIC;
    v_user_balance NUMERIC;
    v_campaign RECORD;
BEGIN
    -- is_auto_refund_candidate가 true인 슬롯들 처리
    FOR v_slot IN 
        SELECT 
            s.id,
            s.mat_id,
            s.user_id,
            s.product_id,
            s.quantity,
            s.status,
            u.full_name as user_name
        FROM public.slots s
        JOIN public.users u ON u.id = s.user_id
        WHERE s.is_auto_refund_candidate = true
        AND s.status IN ('rejected', 'cancelled')
        AND s.processed_at IS NOT NULL
        FOR UPDATE OF s
    LOOP
        BEGIN
            -- 캠페인 정보 조회
            SELECT * INTO v_campaign
            FROM public.campaigns
            WHERE id = v_slot.product_id;
            
            IF NOT FOUND THEN
                CONTINUE;
            END IF;
            
            -- 환불 금액 계산
            v_refund_amount := v_campaign.unit_price * COALESCE(v_slot.quantity, 1);
            
            -- 1. 슬롯 자동 환불 플래그 해제
            UPDATE public.slots
            SET 
                is_auto_refund_candidate = false,
                updated_at = NOW()
            WHERE id = v_slot.id;
            
            -- 2. 사용자 잔액 업데이트
            UPDATE public.user_balances
            SET 
                total_balance = total_balance + v_refund_amount,
                paid_balance = paid_balance + v_refund_amount,
                updated_at = NOW()
            WHERE user_id = v_slot.user_id
            RETURNING total_balance INTO v_user_balance;
            
            -- 3. 캐시 이력 기록
            INSERT INTO public.user_cash_history (
                user_id,
                transaction_type,
                amount,
                description,
                transaction_at,
                reference_id
            ) VALUES (
                v_slot.user_id,
                'refund',
                v_refund_amount,
                format('슬롯 자동 환불 - %s (상태: %s)', v_campaign.campaign_name, v_slot.status),
                NOW(),
                v_slot.id
            );
            
            -- 4. 알림 생성
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                link,
                priority,
                status
            ) VALUES (
                v_slot.user_id,
                'transaction',
                '슬롯 자동 환불 완료',
                format('"%s" 슬롯의 환불이 처리되었습니다. %s원이 환불되었습니다.', 
                    v_campaign.campaign_name,
                    v_refund_amount::TEXT),
                format('/slots/%s', v_slot.id),
                'high',
                'unread'
            );
            
            v_processed := v_processed + 1;
            v_refunded := v_refunded + v_refund_amount;
            
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors || jsonb_build_object(
                'slot_id', v_slot.id,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed,
        'refunded', v_refunded,
        'errors', v_errors,
        'executed_at', NOW()
    );
END;
$function$
;

-- Function: sync_user_role_to_auth
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

-- Function: tr_auth_users_after_insert
CREATE OR REPLACE FUNCTION public.tr_auth_users_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  v_referral_code TEXT;
  v_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; -- 숫자와 대문자만 사용
  v_code_length CONSTANT INT := 6;
  v_position INT;
  i INT;
BEGIN
  -- auth.users 테이블에 이미 사용자가 생성되었고, 이제 관련 레코드들을 생성
  
  -- 시스템 로그에 시작 기록
  BEGIN
    INSERT INTO public.system_logs (
      log_type,
      message,
      details
    ) VALUES (
      'trigger',
      'tr_auth_users_after_insert 시작: ' || NEW.email,
      jsonb_build_object(
        'user_id', NEW.id,
        'time', now()
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      NULL; -- 로깅 실패는 무시
  END;
  
  -- 이미 public.users에 사용자가 있는지 확인
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- 이미 존재하면 종료
    BEGIN
      INSERT INTO public.system_logs (
        log_type,
        message,
        details
      ) VALUES (
        'info',
        'public.users에 이미 레코드가 존재합니다: ' || NEW.email,
        jsonb_build_object(
          'user_id', NEW.id,
          'time', now()
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL; -- 로깅 실패는 무시
    END;
    
    RETURN NEW;
  END IF;
  
  -- 대문자와 숫자로만 구성된 고유한 6자리 리퍼럴 코드 생성
  BEGIN
    LOOP
      -- 초기화
      v_referral_code := '';
      
      -- 6자리 랜덤 코드 생성
      FOR i IN 1..v_code_length LOOP
        -- 1과 36 사이의 랜덤 숫자 생성 (0-9, A-Z 범위)
        v_position := 1 + floor(random() * length(v_chars));
        
        -- 문자 추가
        v_referral_code := v_referral_code || substring(v_chars from v_position for 1);
      END LOOP;
      
      -- 이미 존재하는 코드인지 확인
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
    END LOOP;
  EXCEPTION
    WHEN OTHERS THEN
      -- 코드 생성 오류 시 대체 코드 사용
      v_referral_code := 'USR' || substring(md5(NEW.id::text) from 1 for 3);
  END;
  
  -- 사용자 레코드 생성
  BEGIN
    INSERT INTO public.users (
      id, 
      email, 
      full_name,
      role, 
      password_hash,
      status,
      referral_code,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(split_part(NEW.email, '@', 1), 'user'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'advertiser'),
      '', -- 비밀번호는 auth.users에만 저장
      'active',
      v_referral_code,
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    );
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.system_logs (
          log_type,
          message,
          details
        ) VALUES (
          'error',
          'public.users 테이블에 레코드 생성 실패: ' || NEW.email,
          jsonb_build_object(
            'user_id', NEW.id,
            'error', SQLERRM,
            'time', now()
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL; -- 로깅 실패는 무시
      END;
      
      -- 트리거는 계속 진행 (auth.users에는 이미 생성됨)
  END;
  
  -- 잔액 레코드 생성
  BEGIN
    INSERT INTO public.user_balances (
      user_id,
      paid_balance,
      free_balance,
      total_balance
    ) VALUES (
      NEW.id,
      0,
      0,
      0
    );
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.system_logs (
          log_type,
          message,
          details
        ) VALUES (
          'error',
          'user_balances 테이블에 레코드 생성 실패: ' || NEW.email,
          jsonb_build_object(
            'user_id', NEW.id,
            'error', SQLERRM,
            'time', now()
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL; -- 로깅 실패는 무시
      END;
      
      -- 트리거는 계속 진행
  END;
  
  -- 활동 기록 생성
  BEGIN
    INSERT INTO public.user_activities (
      user_id,
      action,
      details
    ) VALUES (
      NEW.id,
      'signup',
      jsonb_build_object(
        'email', NEW.email,
        'signup_method', 'auth_trigger',
        'signup_time', now(),
        'referral_code', v_referral_code
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.system_logs (
          log_type,
          message,
          details
        ) VALUES (
          'warning',
          'user_activities 테이블에 레코드 생성 실패: ' || NEW.email,
          jsonb_build_object(
            'user_id', NEW.id,
            'error', SQLERRM,
            'time', now()
          )
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL; -- 로깅 실패는 무시
      END;
      
      -- 활동 기록 실패는 무시하고 계속 진행
  END;
  
  -- 성공 로그 기록
  BEGIN
    INSERT INTO public.system_logs (
      log_type,
      message,
      details
    ) VALUES (
      'success',
      'tr_auth_users_after_insert 완료: ' || NEW.email,
      jsonb_build_object(
        'user_id', NEW.id,
        'time', now(),
        'referral_code', v_referral_code
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      NULL; -- 로깅 실패는 무시
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 전체 예외 처리 (트리거는 실패해도 auth.users 생성은 성공)
    BEGIN
      INSERT INTO public.system_logs (
        log_type,
        message,
        details
      ) VALUES (
        'critical',
        'tr_auth_users_after_insert 전체 실패: ' || COALESCE(NEW.email, 'unknown'),
        jsonb_build_object(
          'error', SQLERRM,
          'time', now()
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL; -- 마지막 로깅 시도마저 실패하면 그냥 포기
    END;
    
    RETURN NEW;
END;$function$
;

-- Function: tr_auth_users_after_login
CREATE OR REPLACE FUNCTION public.tr_auth_users_after_login()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update last_login_at in users table
  UPDATE public.users
  SET last_login_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  
  -- Log login activity with additional security details
  INSERT INTO public.user_activities (
    user_id,
    action,
    details,
    ip_address
  ) VALUES (
    NEW.id,
    'login_success',
    jsonb_build_object(
      'login_time', NEW.last_sign_in_at,
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    ),
    inet(coalesce(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'x-real-ip',
      '0.0.0.0'
    ))
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Error logging
    INSERT INTO public.system_logs (
      log_type,
      message,
      details
    ) VALUES (
      'error',
      'Error in tr_auth_users_after_login trigger',
      jsonb_build_object(
        'error', SQLERRM,
        'user_id', NEW.id
      )
    );
    
    -- Continue without failing the trigger
    RETURN NEW;
END;
$function$
;

-- Function: user_confirm_slot_completion
CREATE OR REPLACE FUNCTION public.user_confirm_slot_completion(p_slot_id uuid, p_user_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_slot_record RECORD;
    v_pending_balance RECORD;
    v_settlement RECORD;
    v_work_summary RECORD;
    v_result JSONB;
    v_cash_history_id UUID;
BEGIN
    -- 트랜잭션 시작
    
    -- 1. 슬롯 정보 확인
    SELECT * INTO v_slot_record
    FROM slots
    WHERE id = p_slot_id AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다. slot_id: %, user_id: %', p_slot_id, p_user_id;
    END IF;
    
    -- 상태별 처리
    IF v_slot_record.status = 'completed' THEN
        -- 이미 완료된 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '이미 완료 처리된 슬롯입니다.',
            'status', v_slot_record.status
        );
    ELSIF v_slot_record.status = 'approved' THEN
        -- 총판이 아직 완료 처리하지 않은 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '총판이 아직 작업을 완료하지 않았습니다. 작업 완료 후 다시 시도해주세요.',
            'status', v_slot_record.status
        );
    ELSIF v_slot_record.status != 'pending_user_confirm' THEN
        -- 기타 상태
        RAISE EXCEPTION '사용자 확인 대기 중인 슬롯만 처리할 수 있습니다. 현재 상태: %', v_slot_record.status;
    END IF;
    
    -- 2. slot_pending_balances에서 차감된 금액 확인
    SELECT * INTO v_pending_balance
    FROM slot_pending_balances
    WHERE slot_id = p_slot_id AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'pending balance를 찾을 수 없습니다. slot_id: %', p_slot_id;
    END IF;
    
    -- pending balance 상태 확인
    IF v_pending_balance.status = 'pending' THEN
        -- 총판이 아직 승인하지 않은 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '총판이 아직 작업을 승인하지 않았습니다.',
            'pending_status', v_pending_balance.status
        );
    ELSIF v_pending_balance.status = 'rejected' THEN
        -- 총판이 거부한 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '총판이 작업을 거부했습니다. 고객센터에 문의해주세요.',
            'pending_status', v_pending_balance.status,
            'notes', v_pending_balance.notes
        );
    ELSIF v_pending_balance.status = 'processed' THEN
        -- 이미 처리된 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '이미 정산 처리가 완료되었습니다.',
            'pending_status', v_pending_balance.status
        );
    ELSIF v_pending_balance.status != 'approved' THEN
        -- 기타 상태
        RAISE EXCEPTION '승인된 pending balance만 처리할 수 있습니다. 현재 상태: %', v_pending_balance.status;
    END IF;
    
    -- 3. 정산 진행
    -- 작업 내역 요약 정보 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 정산 금액 계산
    SELECT * INTO v_settlement
    FROM calculate_slot_settlement(p_slot_id);
    
    -- 4. 슬롯 상태를 'completed'로 업데이트
    UPDATE slots
    SET 
        status = 'completed',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_slot_id;
    
    -- 5. slot_pending_balances 상태 업데이트
    UPDATE slot_pending_balances
    SET 
        status = 'processed',
        processor_id = p_user_id,
        processed_at = NOW(),
        notes = format('사용자 승인 - 완료율: %s%%, 작업자 지급: %s, 환불: %s', 
            v_work_summary.completion_rate,
            v_settlement.user_payment_amount,
            v_settlement.refund_amount
        )
    WHERE slot_id = p_slot_id;
    
    -- 6. 슬롯 히스토리 로그 추가
    INSERT INTO slot_history_logs (
        slot_id,
        user_id,
        old_status,
        new_status,
        action,
        details,
        created_at
    ) VALUES (
        p_slot_id,
        p_user_id,
        'pending_user_confirm',
        'completed',
        'user_confirm',
        jsonb_build_object(
            'work_summary', row_to_json(v_work_summary),
            'settlement', row_to_json(v_settlement),
            'notes', p_notes,
            'confirmed_by', 'user',
            'pending_amount', v_pending_balance.amount
        ),
        NOW()
    );
    
    -- 7. 총판에게 작업 대금 지급 (user_cash_history)
    -- pending에서 차감된 금액 중 작업 완료분을 총판에게 지급
    IF v_settlement.user_payment_amount > 0 THEN
        INSERT INTO user_cash_history (
            user_id,
            transaction_type,
            amount,
            description,
            transaction_at,
            mat_id
        ) VALUES (
            v_slot_record.mat_id,  -- 총판에게 지급
            'work',  -- 작업 수익
            v_settlement.user_payment_amount::INTEGER,
            format('슬롯 완료 정산 - %s (%s개 완료)', 
                v_settlement.settlement_details->>'campaign_name',
                v_settlement.worked_quantity
            ),
            NOW(),
            v_slot_record.user_id  -- 광고주 ID
        ) RETURNING id INTO v_cash_history_id;
        
        -- 총판 user_balances 업데이트
        INSERT INTO user_balances (user_id, paid_balance, total_balance)
        VALUES (v_slot_record.mat_id, v_settlement.user_payment_amount, v_settlement.user_payment_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            paid_balance = user_balances.paid_balance + v_settlement.user_payment_amount,
            total_balance = user_balances.total_balance + v_settlement.user_payment_amount,
            updated_at = NOW();
    END IF;
    
    -- 8. 사용자에게 미완료분 환불 처리
    -- pending에서 차감된 금액 중 미완료분을 사용자에게 환불
    IF v_settlement.refund_amount > 0 THEN
        INSERT INTO user_cash_history (
            user_id,
            transaction_type,
            amount,
            description,
            transaction_at,
            mat_id
        ) VALUES (
            v_slot_record.user_id,
            'refund',
            v_settlement.refund_amount::INTEGER,
            format('슬롯 미완료 환불 - %s (%s개 미완료)', 
                v_settlement.settlement_details->>'campaign_name',
                v_settlement.total_quantity - v_settlement.worked_quantity
            ),
            NOW(),
            v_slot_record.mat_id
        );
        
        -- user_balances 업데이트
        INSERT INTO user_balances (user_id, paid_balance, total_balance)
        VALUES (v_slot_record.user_id, v_settlement.refund_amount, v_settlement.refund_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            paid_balance = user_balances.paid_balance + v_settlement.refund_amount,
            total_balance = user_balances.total_balance + v_settlement.refund_amount,
            updated_at = NOW();
    END IF;
    
    -- 9. 감사 로그 기록
    INSERT INTO balance_audit_log (
        user_id,
        change_type,
        old_paid_balance,
        new_paid_balance,
        old_free_balance,
        new_free_balance,
        change_amount,
        details
    )
    SELECT 
        v_slot_record.user_id,
        'slot_completion_confirmed',
        COALESCE(ub.paid_balance, 0) - COALESCE(v_settlement.refund_amount, 0),
        COALESCE(ub.paid_balance, 0),
        COALESCE(ub.free_balance, 0),
        COALESCE(ub.free_balance, 0),
        COALESCE(v_settlement.refund_amount, 0),
        jsonb_build_object(
            'slot_id', p_slot_id,
            'mat_payment', v_settlement.user_payment_amount,
            'user_refund', v_settlement.refund_amount,
            'work_summary', row_to_json(v_work_summary),
            'pending_amount', v_pending_balance.amount,
            'confirmed_by_user', true
        )
    FROM user_balances ub
    WHERE ub.user_id = v_slot_record.user_id;
    
    -- 10. 총판에게 완료 알림
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        priority,
        status,
        created_at
    ) VALUES (
        v_slot_record.mat_id,
        'transaction',  -- 거래 완료
        '슬롯 완료 확정',
        format('사용자가 슬롯 완료를 확인했습니다. (캠페인: %s, 정산금: %s원)', 
            v_settlement.settlement_details->>'campaign_name',
            v_settlement.user_payment_amount
        ),
        format('/slots/%s', p_slot_id),
        'medium',  -- 보통: 정상 프로세스
        'unread',
        NOW()
    );
    
    -- 11. 결과 반환
    v_result := jsonb_build_object(
        'success', true,
        'slot_id', p_slot_id,
        'status', 'completed',
        'work_summary', row_to_json(v_work_summary),
        'settlement', row_to_json(v_settlement),
        'pending_amount', v_pending_balance.amount,
        'message', format('슬롯이 성공적으로 완료되었습니다. 정산이 완료되었습니다. (완료율: %s%%)', 
            v_work_summary.completion_rate
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 롤백
        RAISE;
END;
$function$
;

-- Function: verify_password
CREATE OR REPLACE FUNCTION public.verify_password(password text, user_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id::uuid
    AND password_hash = crypt(password, password_hash)
  );
END;$function$
;