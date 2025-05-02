-- 기존 RLS 정책 모두 제거하고 새로 설정

-- 기존 정책 제거
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

-- RLS 설정 초기화
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- RLS 다시 활성화
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 새로운 단순화된 RLS 정책

-- 채팅방 RLS (간소화)
CREATE POLICY "채팅방 접근" ON chat_rooms
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
) WITH CHECK (true);

-- 참가자 RLS (간소화)
CREATE POLICY "참가자 접근" ON chat_participants
FOR ALL USING (true) WITH CHECK (true);

-- 메시지 RLS (간소화)
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