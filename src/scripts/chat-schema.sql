-- 채팅 스키마 생성

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_message_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 채팅 참가자 테이블
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_message_id UUID,
  last_seen TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  attachments JSONB,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 채팅방의 last_message_id 외래 키 추가
ALTER TABLE chat_rooms
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id)
REFERENCES chat_messages(id)
ON DELETE SET NULL;

-- 채팅 참가자의 last_read_message_id 외래 키 추가
ALTER TABLE chat_participants
ADD CONSTRAINT fk_last_read_message
FOREIGN KEY (last_read_message_id)
REFERENCES chat_messages(id)
ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_id ON chat_rooms(last_message_id);

-- RLS 정책 설정

-- 채팅방 RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "채팅방 조회" ON chat_rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "채팅방 생성" ON chat_rooms
FOR INSERT WITH CHECK (true);

CREATE POLICY "채팅방 업데이트" ON chat_rooms
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
  )
);

-- 채팅 참가자 RLS
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "참가자 조회" ON chat_participants
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM chat_participants AS cp
    WHERE cp.room_id = chat_participants.room_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "참가자 추가" ON chat_participants
FOR INSERT WITH CHECK (true);

CREATE POLICY "참가자 업데이트" ON chat_participants
FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "참가자 삭제" ON chat_participants
FOR DELETE USING (
  user_id = auth.uid()
);

-- 채팅 메시지 RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "메시지 조회" ON chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_messages.room_id
      AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "메시지 작성" ON chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.room_id = chat_messages.room_id
      AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "메시지 업데이트" ON chat_messages
FOR UPDATE USING (
  sender_id::uuid = auth.uid() OR
  sender_id = 'system'
);

-- 알림 웹훅 트리거
CREATE OR REPLACE FUNCTION notify_chat_message() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_message_inserted
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION notify_chat_message();

-- Realtime 설정
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;