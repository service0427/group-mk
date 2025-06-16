-- =============================================================================
-- 보장성 슬롯 견적 요청 테이블 개선 (키워드 및 작업 정보 추가)
-- 작성일: 2025-06-16
-- 설명: guarantee_slot_requests에 키워드, 작업 세부사항 등 필수 정보 추가
-- =============================================================================

-- 1. guarantee_slot_requests 테이블에 새로운 컬럼들 추가
ALTER TABLE public.guarantee_slot_requests 
ADD COLUMN IF NOT EXISTS keyword_id BIGINT REFERENCES keywords(id),
ADD COLUMN IF NOT EXISTS input_data JSONB,  -- MID, URL, 기타 캠페인별 입력 정보 (slots 테이블과 동일)
ADD COLUMN IF NOT EXISTS start_date DATE,   -- 작업 시작 예정일
ADD COLUMN IF NOT EXISTS end_date DATE,     -- 작업 종료 예정일
ADD COLUMN IF NOT EXISTS quantity SMALLINT DEFAULT 1,  -- 수량
ADD COLUMN IF NOT EXISTS user_reason TEXT,  -- 사용자 요청 사유
ADD COLUMN IF NOT EXISTS additional_requirements TEXT;  -- 추가 요구사항

-- 2. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_keyword_id ON guarantee_slot_requests(keyword_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_start_date ON guarantee_slot_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_end_date ON guarantee_slot_requests(end_date);

-- 3. input_data 컬럼에 GIN 인덱스 추가 (JSONB 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_guarantee_requests_input_data_gin ON guarantee_slot_requests USING GIN (input_data);

-- 4. guarantee_slots 테이블에도 동일한 정보 추가 (협상 완료 후 전체 정보 이관)
ALTER TABLE public.guarantee_slots
ADD COLUMN IF NOT EXISTS keyword_id BIGINT REFERENCES keywords(id),
ADD COLUMN IF NOT EXISTS input_data JSONB,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS quantity SMALLINT DEFAULT 1,
ADD COLUMN IF NOT EXISTS user_reason TEXT,
ADD COLUMN IF NOT EXISTS additional_requirements TEXT;

-- 5. guarantee_slots 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_keyword_id ON guarantee_slots(keyword_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_start_date ON guarantee_slots(start_date);
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_end_date ON guarantee_slots(end_date);
CREATE INDEX IF NOT EXISTS idx_guarantee_slots_input_data_gin ON guarantee_slots USING GIN (input_data);

-- 6. 업데이트된 뷰 재생성
DROP VIEW IF EXISTS guarantee_slots_status_view;
CREATE OR REPLACE VIEW guarantee_slots_status_view AS
SELECT 
    gs.id,
    gs.user_id,
    u.email as user_email,
    u.full_name as user_name,
    gs.distributor_id,
    d.email as distributor_email,
    d.full_name as distributor_name,
    gs.product_id,
    c.campaign_name,
    c.service_type,
    gs.keyword_id,
    k.main_keyword,
    k.keyword1,
    k.keyword2,
    k.keyword3,
    gs.target_rank,
    gs.guarantee_count,
    gs.completed_count,
    gs.daily_guarantee_amount,
    gs.total_amount,
    gs.status,
    gs.input_data,
    gs.start_date,
    gs.end_date,
    gs.quantity,
    gs.user_reason,
    gs.additional_requirements,
    gsh.user_holding_amount,
    gsh.distributor_holding_amount,
    gsh.distributor_released_amount,
    gs.created_at,
    gs.updated_at
FROM guarantee_slots gs
LEFT JOIN users u ON gs.user_id = u.id
LEFT JOIN users d ON gs.distributor_id = d.id
LEFT JOIN campaigns c ON gs.product_id = c.id
LEFT JOIN keywords k ON gs.keyword_id = k.id
LEFT JOIN guarantee_slot_holdings gsh ON gs.id = gsh.guarantee_slot_id;

-- 7. 견적 요청 상세 정보 뷰 생성
CREATE OR REPLACE VIEW guarantee_requests_detail_view AS
SELECT 
    gsr.id,
    gsr.campaign_id,
    gsr.user_id,
    u.email as user_email,
    u.full_name as user_name,
    gsr.distributor_id,
    d.email as distributor_email,
    d.full_name as distributor_name,
    gsr.keyword_id,
    k.main_keyword,
    k.keyword1,
    k.keyword2,
    k.keyword3,
    k.url as keyword_url,
    k.mid as keyword_mid,
    gsr.target_rank,
    gsr.guarantee_count,
    gsr.initial_budget,
    gsr.final_daily_amount,
    gsr.status,
    gsr.input_data,
    gsr.start_date,
    gsr.end_date,
    gsr.quantity,
    gsr.user_reason,
    gsr.additional_requirements,
    c.campaign_name,
    c.service_type,
    c.guarantee_unit,
    gsr.created_at,
    gsr.updated_at,
    -- 협상 메시지 수
    (SELECT COUNT(*) FROM guarantee_slot_negotiations gsn WHERE gsn.request_id = gsr.id) as message_count,
    -- 읽지 않은 메시지 수
    (SELECT COUNT(*) FROM guarantee_slot_negotiations gsn WHERE gsn.request_id = gsr.id AND gsn.is_read = false) as unread_count
FROM guarantee_slot_requests gsr
LEFT JOIN users u ON gsr.user_id = u.id
LEFT JOIN users d ON gsr.distributor_id = d.id
LEFT JOIN campaigns c ON gsr.campaign_id = c.id
LEFT JOIN keywords k ON gsr.keyword_id = k.id;

-- 8. 컬럼 코멘트 추가
COMMENT ON COLUMN guarantee_slot_requests.keyword_id IS '신청한 키워드 ID (keywords 테이블 참조)';
COMMENT ON COLUMN guarantee_slot_requests.input_data IS '캠페인별 입력 데이터 (MID, URL, 기타 필수 정보)';
COMMENT ON COLUMN guarantee_slot_requests.start_date IS '작업 시작 예정일';
COMMENT ON COLUMN guarantee_slot_requests.end_date IS '작업 종료 예정일';
COMMENT ON COLUMN guarantee_slot_requests.quantity IS '신청 수량';
COMMENT ON COLUMN guarantee_slot_requests.user_reason IS '사용자 요청 사유';
COMMENT ON COLUMN guarantee_slot_requests.additional_requirements IS '추가 요구사항 및 특이사항';

COMMENT ON COLUMN guarantee_slots.keyword_id IS '작업 키워드 ID (keywords 테이블 참조)';
COMMENT ON COLUMN guarantee_slots.input_data IS '작업 입력 데이터 (MID, URL 등)';
COMMENT ON COLUMN guarantee_slots.start_date IS '작업 시작일';
COMMENT ON COLUMN guarantee_slots.end_date IS '작업 종료일';
COMMENT ON COLUMN guarantee_slots.quantity IS '작업 수량';
COMMENT ON COLUMN guarantee_slots.user_reason IS '사용자 요청 사유';
COMMENT ON COLUMN guarantee_slots.additional_requirements IS '추가 요구사항';

-- 9. 기존 데이터 마이그레이션을 위한 함수 (필요시 사용)
CREATE OR REPLACE FUNCTION migrate_guarantee_slot_data()
RETURNS void AS $$
BEGIN
    -- 기존 guarantee_slot_requests의 빈 input_data를 기본값으로 설정
    UPDATE guarantee_slot_requests 
    SET input_data = '{}'::jsonb 
    WHERE input_data IS NULL;
    
    -- 기존 guarantee_slots의 빈 input_data를 기본값으로 설정
    UPDATE guarantee_slots 
    SET input_data = '{}'::jsonb 
    WHERE input_data IS NULL;
    
    RAISE NOTICE '보장형 슬롯 데이터 마이그레이션 완료';
END;
$$ LANGUAGE plpgsql;

-- 10. 마이그레이션 실행
SELECT migrate_guarantee_slot_data();