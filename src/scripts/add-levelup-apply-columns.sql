-- levelup_apply 테이블에 target_role과 current_role 컬럼 추가

-- 먼저 컬럼이 존재하는지 확인하고 추가
DO $$ 
BEGIN
    -- target_role 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'levelup_apply' 
                   AND column_name = 'target_role') THEN
        ALTER TABLE levelup_apply ADD COLUMN target_role TEXT;
    END IF;
    
    -- current_user_role 컬럼 추가 (current_role은 PostgreSQL 예약어)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'levelup_apply' 
                   AND column_name = 'current_user_role') THEN
        ALTER TABLE levelup_apply ADD COLUMN current_user_role TEXT;
    END IF;
END $$;

-- 3. 기존 데이터에 대한 기본값 설정 (옵션)
-- 기존의 pending 상태인 레코드들을 distributor로 기본 설정
UPDATE levelup_apply 
SET target_role = 'distributor' 
WHERE target_role IS NULL AND status = 'pending';

-- 4. 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN levelup_apply.target_role IS '신청 대상 역할 (distributor, agency 등)';
COMMENT ON COLUMN levelup_apply.current_user_role IS '신청 당시 사용자의 현재 역할';

-- 5. RLS 정책이 있다면 확인 (읽기 권한은 이미 있을 것으로 예상)
-- 필요한 경우 추가 정책 생성