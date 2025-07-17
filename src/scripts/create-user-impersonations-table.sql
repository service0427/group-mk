-- 사용자 전환 기록 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_impersonations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  impersonator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_user_impersonations_impersonator ON public.user_impersonations(impersonator_id);
CREATE INDEX idx_user_impersonations_target ON public.user_impersonations(target_user_id);
CREATE INDEX idx_user_impersonations_active ON public.user_impersonations(is_active) WHERE is_active = true;

/*
-- RLS 활성화
ALTER TABLE public.user_impersonations ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 개발자와 운영자만 조회 가능
CREATE POLICY "Developers and operators can view impersonations" ON public.user_impersonations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('developer', 'operator')
    )
  );

-- RLS 정책: 개발자와 운영자만 생성 가능
CREATE POLICY "Developers and operators can create impersonations" ON public.user_impersonations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('developer', 'operator')
    )
  );


-- RLS 정책: 본인이 생성한 전환만 업데이트 가능
CREATE POLICY "Users can update their own impersonations" ON public.user_impersonations
  FOR UPDATE
  USING (impersonator_id = auth.uid())
  WITH CHECK (impersonator_id = auth.uid());
*/
-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_user_impersonations_updated_at
  BEFORE UPDATE ON public.user_impersonations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE public.user_impersonations IS '사용자 전환(impersonation) 기록 테이블';
COMMENT ON COLUMN public.user_impersonations.impersonator_id IS '전환을 실행한 사용자 ID (운영자/개발자)';
COMMENT ON COLUMN public.user_impersonations.target_user_id IS '전환 대상 사용자 ID';
COMMENT ON COLUMN public.user_impersonations.reason IS '전환 사유 (선택사항)';