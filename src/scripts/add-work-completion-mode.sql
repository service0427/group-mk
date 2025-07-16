-- ============================================
-- 자동완료/수동완료 기능을 위한 campaigns 테이블 수정
-- 작성일: 2025-01-15
-- ============================================

-- campaigns 테이블에 작업 완료 방식 관련 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN work_completion_mode TEXT DEFAULT 'manual' CHECK (work_completion_mode IN ('manual', 'auto')),
ADD COLUMN auto_completion_hour INTEGER DEFAULT 18 CHECK (auto_completion_hour >= 0 AND auto_completion_hour <= 23);

-- 컬럼 설명 추가
COMMENT ON COLUMN campaigns.work_completion_mode IS '작업 완료 방식: manual(수동-매일 작업입력), auto(자동-종료일에 일괄처리)';
COMMENT ON COLUMN campaigns.auto_completion_hour IS '자동완료 시간(0-23시), work_completion_mode가 auto일 때만 사용';

-- 인덱스 추가 (자동완료 처리 시 빠른 조회를 위해)
CREATE INDEX idx_campaigns_auto_completion 
ON campaigns(work_completion_mode, auto_completion_hour) 
WHERE work_completion_mode = 'auto';