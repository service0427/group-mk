-- message_type 컬럼 크기 증가 및 제약조건 수정
-- 작성일: 2025-06-21

-- 1. message_type 컬럼 크기 변경 (20 -> 30)
ALTER TABLE public.guarantee_slot_negotiations 
ALTER COLUMN message_type TYPE VARCHAR(30);

-- 2. 기존 제약조건 삭제
ALTER TABLE public.guarantee_slot_negotiations 
DROP CONSTRAINT IF EXISTS message_type_check;

-- 3. 새로운 제약조건 추가 (renegotiation_request 포함)
ALTER TABLE public.guarantee_slot_negotiations
ADD CONSTRAINT message_type_check 
CHECK (message_type IN ('message', 'price_proposal', 'counter_offer', 'acceptance', 'renegotiation_request'));

-- 4. sender_role/sender_type 문제도 함께 해결
-- 컬럼명이 sender_role인 경우 sender_type으로 변경
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'guarantee_slot_negotiations' 
        AND column_name = 'sender_role'
        AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'guarantee_slot_negotiations' 
            AND column_name = 'sender_type'
        )
    ) THEN
        ALTER TABLE public.guarantee_slot_negotiations 
        RENAME COLUMN sender_role TO sender_type;
        
        -- 제약조건도 함께 변경
        ALTER TABLE public.guarantee_slot_negotiations 
        DROP CONSTRAINT IF EXISTS sender_role_check;
        
        ALTER TABLE public.guarantee_slot_negotiations
        ADD CONSTRAINT sender_type_check 
        CHECK (sender_type IN ('user', 'distributor', 'admin'));
    END IF;
END $$;

-- 5. 코멘트 업데이트
COMMENT ON COLUMN guarantee_slot_negotiations.message_type IS '메시지 타입 (message: 일반 메시지, price_proposal: 가격 제안, counter_offer: 역제안, acceptance: 수락, renegotiation_request: 재협상 요청)';
COMMENT ON COLUMN guarantee_slot_negotiations.sender_type IS '발신자 타입 (user: 사용자, distributor: 총판, admin: 관리자)';