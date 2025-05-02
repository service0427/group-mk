-- chat-schema-update.sql
-- admin 역할을 operator 역할로 변경하고 RLS 정책을 최적화하는 스크립트

-- 기존 RLS 정책 제거
DROP POLICY IF EXISTS "채팅방 조회" ON chat_rooms;
DROP POLICY IF EXISTS "채팅방 생성" ON chat_rooms;
DROP POLICY IF EXISTS "채팅방 업데이트" ON chat_rooms;

DROP POLICY IF EXISTS "참가자 조회" ON chat_participants;
DROP POLICY IF EXISTS "참가자 추가" ON chat_participants;
DROP POLICY IF EXISTS "참가자 업데이트" ON chat_participants;
DROP POLICY IF EXISTS "참가자 삭제" ON chat_participants;

DROP POLICY IF EXISTS "메시지 조회" ON chat_messages;
DROP POLICY IF EXISTS "메시지 작성" ON chat_messages;
DROP POLICY IF EXISTS "메시지 업데이트" ON chat_messages;

-- RLS 정책 활성화 확인
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 단순화된 채팅방 정책
CREATE POLICY "채팅방 접근" ON chat_rooms
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
) WITH CHECK (true);

-- 단순화된 참가자 정책
CREATE POLICY "참가자 접근" ON chat_participants
FOR ALL USING (true) WITH CHECK (true);

-- 단순화된 메시지 정책
CREATE POLICY "메시지 접근" ON chat_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_messages.room_id
    AND chat_participants.user_id = auth.uid()
  )
) WITH CHECK (true);

-- Realtime 설정 다시 적용
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 기존 users 테이블에 있는 admin 역할을 operator로 변경 (있는 경우)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"operator"'
)
WHERE raw_user_meta_data->>'role' = 'admin';

-- 운영자 진입점 생성 (없을 경우 실행, 테스트용 계정)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- SELECT 
--   uuid_generate_v4(),
--   'operator@example.com',
--   crypt('password123', gen_salt('bf')),
--   NOW(),
--   '{"role": "operator"}'::jsonb
-- WHERE NOT EXISTS (
--   SELECT 1 FROM auth.users WHERE raw_user_meta_data->>'role' = 'operator'
-- );

-- 메시지에서 역할 업데이트
UPDATE chat_messages
SET sender_role = 'operator'
WHERE sender_role = 'admin';