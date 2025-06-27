-- guarantee_slot_transactions 테이블에 created_by 컬럼 추가
-- 작성일: 2025-06-27
-- 설명: 반려 시 오류 해결을 위해 누락된 created_by 컬럼 추가

-- created_by 컬럼이 없으면 추가
ALTER TABLE public.guarantee_slot_transactions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 기존 데이터가 있을 경우를 위해 user_id로 업데이트 (필요시)
UPDATE public.guarantee_slot_transactions
SET created_by = user_id
WHERE created_by IS NULL;