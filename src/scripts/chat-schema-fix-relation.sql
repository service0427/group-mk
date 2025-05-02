-- 채팅방과 메시지 간의 관계 다시 설정

-- 1. 기존 외래 키 제약 조건 제거 (이미 존재하는 경우)
ALTER TABLE chat_rooms 
DROP CONSTRAINT IF EXISTS fk_last_message;

-- 2. 외래 키 제약 조건 다시 추가
ALTER TABLE chat_rooms
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id)
REFERENCES chat_messages(id)
ON DELETE SET NULL;

-- 3. 참가자의 last_read_message_id 외래 키 제약 조건 제거 (이미 존재하는 경우)
ALTER TABLE chat_participants
DROP CONSTRAINT IF EXISTS fk_last_read_message;

-- 4. 참가자의 외래 키 제약 조건 다시 추가
ALTER TABLE chat_participants
ADD CONSTRAINT fk_last_read_message
FOREIGN KEY (last_read_message_id)
REFERENCES chat_messages(id)
ON DELETE SET NULL;

-- 5. PostgreSQL의 외래 키 관계 캐시 갱신을 위한 테이블 분석
ANALYZE chat_rooms;
ANALYZE chat_messages;
ANALYZE chat_participants;