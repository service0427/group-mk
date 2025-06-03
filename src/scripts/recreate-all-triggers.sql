-- 모든 트리거 재생성 스크립트
-- TRUNCATE 후에 실행하여 트리거들을 복구합니다

-- 1. user_slot_number 트리거 재생성
-- 함수가 없다면 생성
CREATE OR REPLACE FUNCTION generate_user_slot_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(user_slot_number), 0) + 1
    INTO next_number
    FROM slots
    WHERE mat_id = NEW.mat_id;
    
    NEW.user_slot_number := next_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성
DROP TRIGGER IF EXISTS set_user_slot_number ON slots;
CREATE TRIGGER set_user_slot_number
BEFORE INSERT ON slots
FOR EACH ROW
WHEN (NEW.user_slot_number IS NULL)
EXECUTE FUNCTION generate_user_slot_number();

-- 2. users role 동기화 트리거 재생성
CREATE OR REPLACE FUNCTION sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
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

DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;
CREATE TRIGGER sync_user_role_trigger
  AFTER UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_auth();

-- 3. auth.users 동기화 트리거 재생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'beginner'),
    'active',
    NOW(),
    NOW()
  );
  
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. auth.users 업데이트 트리거
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email 
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();

-- 5. chat 메시지 알림 트리거 (chat_messages 테이블이 있는 경우)
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'chat_message',
    json_build_object(
      'room_id', NEW.room_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'content', NEW.content,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- chat_messages 테이블이 존재하는 경우에만 트리거 생성
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    DROP TRIGGER IF EXISTS chat_message_inserted ON chat_messages;
    CREATE TRIGGER chat_message_inserted
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_chat_message();
  END IF;
END $$;

-- 6. excel_export_templates updated_at 트리거
CREATE OR REPLACE FUNCTION update_excel_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- excel_export_templates 테이블이 존재하는 경우에만 트리거 생성
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'excel_export_templates') THEN
    DROP TRIGGER IF EXISTS update_excel_template_updated_at ON excel_export_templates;
    CREATE TRIGGER update_excel_template_updated_at
      BEFORE UPDATE ON excel_export_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_excel_template_updated_at();
  END IF;
END $$;

-- 트리거 상태 확인
SELECT 
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
    AND n.nspname IN ('public', 'auth')
ORDER BY c.relname, t.tgname;