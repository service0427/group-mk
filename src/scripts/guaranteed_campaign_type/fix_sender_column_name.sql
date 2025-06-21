-- sender_role을 sender_type으로 변경
-- 작성일: 2025-06-21

-- 1. 컬럼명 변경 (이미 sender_role인 경우에만)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'guarantee_slot_negotiations' 
        AND column_name = 'sender_role'
    ) THEN
        ALTER TABLE public.guarantee_slot_negotiations 
        RENAME COLUMN sender_role TO sender_type;
    END IF;
END $$;

-- 2. 제약조건 재생성
ALTER TABLE public.guarantee_slot_negotiations 
DROP CONSTRAINT IF EXISTS sender_role_check;

ALTER TABLE public.guarantee_slot_negotiations
ADD CONSTRAINT sender_type_check 
CHECK (sender_type IN ('user', 'distributor', 'admin'));

-- 3. 코멘트 업데이트
COMMENT ON COLUMN guarantee_slot_negotiations.sender_type IS '발신자 타입 (user: 사용자, distributor: 총판, admin: 관리자)';