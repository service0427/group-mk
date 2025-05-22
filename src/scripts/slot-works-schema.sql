-- 총판 작업 정보 테이블 생성
CREATE TABLE IF NOT EXISTS slot_works_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  work_cnt INTEGER NOT NULL CHECK (work_cnt > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_slot_works_info_slot_id ON slot_works_info(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_works_info_date ON slot_works_info(date);
CREATE INDEX IF NOT EXISTS idx_slot_works_info_created_by ON slot_works_info(created_by);

-- 동일한 슬롯에 대해 같은 날짜에 중복 작업 정보 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_works_info_unique_slot_date 
ON slot_works_info(slot_id, date);

-- RLS 정책 설정
ALTER TABLE slot_works_info ENABLE ROW LEVEL SECURITY;

-- 조회 정책: 작성자나 총판 역할 이상만 조회 가능
CREATE POLICY "작업 정보 조회" ON slot_works_info
FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.role = 'distributor' OR auth.users.role = 'agency' OR 
         auth.users.role = 'operator' OR auth.users.role = 'developer')
  )
);

-- 입력 정책: 총판 역할 이상만 입력 가능
CREATE POLICY "작업 정보 입력" ON slot_works_info
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.role = 'distributor' OR auth.users.role = 'agency' OR 
         auth.users.role = 'operator' OR auth.users.role = 'developer')
  )
);

-- 수정 정책: 작성자나 운영자 이상만 수정 가능
CREATE POLICY "작업 정보 수정" ON slot_works_info
FOR UPDATE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.role = 'operator' OR auth.users.role = 'developer')
  )
);

-- 삭제 정책: 작성자나 운영자 이상만 삭제 가능
CREATE POLICY "작업 정보 삭제" ON slot_works_info
FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.role = 'operator' OR auth.users.role = 'developer')
  )
);

-- 추후 작업 정보 사용을 위한 통계 뷰 생성
CREATE OR REPLACE VIEW slot_works_stats AS
SELECT 
  s.id AS slot_id,
  s.user_id,
  s.campaign_name,
  s.status,
  s.quantity,
  COUNT(sw.id) AS total_work_days,
  SUM(sw.work_cnt) AS total_work_count,
  MAX(sw.date) AS last_work_date
FROM 
  slots s
LEFT JOIN 
  slot_works_info sw ON s.id = sw.slot_id
GROUP BY 
  s.id, s.user_id, s.campaign_name, s.status, s.quantity;

-- Realtime 설정
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE slot_works_info;