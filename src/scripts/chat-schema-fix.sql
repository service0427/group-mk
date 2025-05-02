-- chat_participants 테이블에 대한 RLS 정책 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "참가자 조회" ON chat_participants;
DROP POLICY IF EXISTS "참가자 추가" ON chat_participants;
DROP POLICY IF EXISTS "참가자 업데이트" ON chat_participants;
DROP POLICY IF EXISTS "참가자 삭제" ON chat_participants;

-- 수정된 정책 추가
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
FOR INSERT WITH CHECK (
  true  -- 모든 인증된 사용자가 참가자를 추가할 수 있음
);

CREATE POLICY "참가자 업데이트" ON chat_participants
FOR UPDATE USING (
  user_id = auth.uid()  -- 본인의 참가자 정보만 업데이트 가능
);

CREATE POLICY "참가자 삭제" ON chat_participants
FOR DELETE USING (
  user_id = auth.uid()  -- 본인만 채팅방을 나갈 수 있음
);