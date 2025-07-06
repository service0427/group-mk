-- 알림 타입 업데이트 (슬롯 연장 관련 타입 추가)
-- 2025-07-06 실행
-- supabase-table.sql의 타입과 동기화

-- 1. 기존 constraint 확인
SELECT conname, pg_get_constraintdef(c.oid) 
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE c.conname = 'notifications_type_check'
AND n.nspname = 'public';

-- 2. 기존 constraint 삭제
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 3. 새로운 constraint 추가 (supabase-table.sql과 동일하게)
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'system',
  'transaction', 
  'service',
  'slot',
  'marketing',
  'slot_created',
  'slot_approved',
  'slot_success',
  'slot_refund',
  'slot_extension_requested',  -- 슬롯 연장 요청
  'slot_extension_approved',   -- 슬롯 연장 승인
  'slot_extension_rejected'    -- 슬롯 연장 거절
));

-- 4. 현재 알림 타입 확인
SELECT DISTINCT type, COUNT(*) as count 
FROM public.notifications 
GROUP BY type 
ORDER BY type;