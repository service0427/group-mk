-- =============================================================================
-- 보장형 캠페인 시스템 통합 뷰 및 정책
-- 작성일: 2025-06-18
-- 설명: 보장형 캠페인 시스템의 뷰, RLS 정책 및 권한 설정
-- =============================================================================

-- =============================================================================
-- 뷰(Views) 생성
-- =============================================================================

-- 1. 보장성 슬롯 현황 뷰
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
    gs.target_rank,
    gs.guarantee_count,
    gs.completed_count,
    gs.daily_guarantee_amount,
    gs.total_amount,
    gs.status,
    gsh.user_holding_amount,
    gsh.distributor_holding_amount,
    gsh.distributor_released_amount,
    gs.approved_at,
    gs.approved_by,
    gs.rejected_at,
    gs.rejected_by,
    gs.rejection_reason,
    gs.start_date,
    gs.end_date,
    gs.created_at,
    gs.updated_at
FROM guarantee_slots gs
LEFT JOIN auth.users u ON gs.user_id = u.id
LEFT JOIN auth.users d ON gs.distributor_id = d.id
LEFT JOIN campaigns c ON gs.product_id = c.id
LEFT JOIN guarantee_slot_holdings gsh ON gs.id = gsh.guarantee_slot_id;

-- 2. 보장형 캠페인 뷰
CREATE OR REPLACE VIEW guarantee_campaigns_view AS
SELECT 
    c.id,
    c.campaign_name,
    c.service_type,
    c.slot_type,
    c.guarantee_count,
    c.guarantee_unit,
    c.target_rank,
    c.is_negotiable,
    c.min_guarantee_price,
    c.max_guarantee_price,
    c.status,
    c.created_at,
    COUNT(DISTINCT gs.id) as active_guarantee_slots,
    COUNT(DISTINCT gsr.id) as pending_requests
FROM campaigns c
LEFT JOIN guarantee_slots gs ON c.id = gs.product_id AND gs.status = 'active'
LEFT JOIN guarantee_slot_requests gsr ON c.id = gsr.campaign_id AND gsr.status IN ('requested', 'negotiating')
WHERE c.slot_type = 'guarantee'
AND c.is_guarantee = TRUE
GROUP BY c.id;

-- 3. 일별 정산 대상 뷰
CREATE OR REPLACE VIEW daily_guarantee_check_view AS
SELECT 
    gs.id as slot_id,
    gs.user_id,
    gs.distributor_id,
    gs.product_id,
    c.campaign_name,
    gs.target_rank,
    gs.guarantee_count,
    gs.completed_count,
    gs.daily_guarantee_amount,
    CURRENT_DATE as check_date,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM guarantee_slot_settlements gss 
            WHERE gss.guarantee_slot_id = gs.id 
            AND gss.confirmed_date = CURRENT_DATE
        ) THEN TRUE 
        ELSE FALSE 
    END as already_checked_today
FROM guarantee_slots gs
JOIN campaigns c ON gs.product_id = c.id
WHERE gs.status = 'active'
AND gs.completed_count < gs.guarantee_count;

-- 4. 보장형 견적 요청 상세 뷰
CREATE OR REPLACE VIEW guarantee_requests_detail_view AS
SELECT 
    gsr.id,
    gsr.campaign_id,
    gsr.user_id,
    gsr.distributor_id,
    gsr.target_rank,
    gsr.guarantee_count,
    gsr.initial_budget,
    gsr.status,
    gsr.final_daily_amount,
    gsr.keyword_id,
    gsr.input_data,
    gsr.start_date,
    gsr.end_date,
    gsr.created_at,
    gsr.updated_at,
    c.campaign_name,
    c.service_type,
    c.guarantee_unit,
    c.mat_id as campaign_owner_id,
    u.email as user_email,
    u.full_name as user_name,
    d.email as distributor_email,
    d.full_name as distributor_name,
    k.main_keyword,
    k.keyword1,
    k.keyword2,
    k.keyword3,
    -- 협상 메시지 수
    (SELECT COUNT(*) FROM guarantee_slot_negotiations gsn WHERE gsn.request_id = gsr.id) as message_count,
    -- 최근 메시지 시간
    (SELECT MAX(created_at) FROM guarantee_slot_negotiations gsn WHERE gsn.request_id = gsr.id) as last_message_at,
    -- 구매된 슬롯 ID (있는 경우)
    gs.id as slot_id,
    gs.status as slot_status
FROM guarantee_slot_requests gsr
LEFT JOIN campaigns c ON gsr.campaign_id = c.id
LEFT JOIN auth.users u ON gsr.user_id = u.id
LEFT JOIN auth.users d ON gsr.distributor_id = d.id
LEFT JOIN keywords k ON gsr.keyword_id = k.id
LEFT JOIN guarantee_slots gs ON gsr.id = gs.request_id;

-- =============================================================================
-- RLS (Row Level Security) 정책 설정
-- =============================================================================

-- 1. guarantee_slot_requests 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_slot_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 요청만 조회/수정 가능
CREATE POLICY "Users can view own requests" ON guarantee_slot_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests" ON guarantee_slot_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests" ON guarantee_slot_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- 총판은 자신에게 할당된 요청 조회/수정 가능
CREATE POLICY "Distributors can view assigned requests" ON guarantee_slot_requests
    FOR SELECT USING (auth.uid() = distributor_id);

CREATE POLICY "Distributors can update assigned requests" ON guarantee_slot_requests
    FOR UPDATE USING (auth.uid() = distributor_id);

-- 관리자는 모든 요청 조회/수정 가능
CREATE POLICY "Admins can view all requests" ON guarantee_slot_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 2. guarantee_slot_negotiations 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_slot_negotiations ENABLE ROW LEVEL SECURITY;

-- 해당 요청의 사용자나 총판만 협상 메시지 조회/생성 가능
CREATE POLICY "Request participants can access negotiations" ON guarantee_slot_negotiations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM guarantee_slot_requests gsr
            WHERE gsr.id = request_id
            AND (gsr.user_id = auth.uid() OR gsr.distributor_id = auth.uid())
        )
    );

-- 관리자는 모든 협상 메시지 조회 가능
CREATE POLICY "Admins can view all negotiations" ON guarantee_slot_negotiations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 3. guarantee_slots 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_slots ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 슬롯만 조회 가능
CREATE POLICY "Users can view own slots" ON guarantee_slots
    FOR SELECT USING (auth.uid() = user_id);

-- 총판은 자신이 담당하는 슬롯 조회/수정 가능
CREATE POLICY "Distributors can manage assigned slots" ON guarantee_slots
    FOR ALL USING (auth.uid() = distributor_id);

-- 관리자는 모든 슬롯 조회/수정 가능
CREATE POLICY "Admins can manage all slots" ON guarantee_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 4. guarantee_slot_holdings 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_slot_holdings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 홀딩 정보만 조회 가능
CREATE POLICY "Users can view own holdings" ON guarantee_slot_holdings
    FOR SELECT USING (auth.uid() = user_id);

-- 총판은 자신이 담당하는 슬롯의 홀딩 정보 조회/수정 가능
CREATE POLICY "Distributors can manage assigned holdings" ON guarantee_slot_holdings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM guarantee_slots gs
            WHERE gs.id = guarantee_slot_id
            AND gs.distributor_id = auth.uid()
        )
    );

-- 관리자는 모든 홀딩 정보 조회/수정 가능
CREATE POLICY "Admins can manage all holdings" ON guarantee_slot_holdings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 5. guarantee_slot_settlements 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_slot_settlements ENABLE ROW LEVEL SECURITY;

-- 총판은 자신이 확인한 정산 내역 조회/생성 가능
CREATE POLICY "Distributors can manage settlements" ON guarantee_slot_settlements
    FOR ALL USING (
        auth.uid() = confirmed_by OR
        EXISTS (
            SELECT 1 FROM guarantee_slots gs
            WHERE gs.id = guarantee_slot_id
            AND gs.distributor_id = auth.uid()
        )
    );

-- 사용자는 자신의 슬롯 정산 내역 조회 가능
CREATE POLICY "Users can view own settlements" ON guarantee_slot_settlements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guarantee_slots gs
            WHERE gs.id = guarantee_slot_id
            AND gs.user_id = auth.uid()
        )
    );

-- 관리자는 모든 정산 내역 조회/수정 가능
CREATE POLICY "Admins can manage all settlements" ON guarantee_slot_settlements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 6. guarantee_slot_transactions 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_slot_transactions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 거래 내역만 조회 가능
CREATE POLICY "Users can view own transactions" ON guarantee_slot_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 총판은 자신이 담당하는 슬롯의 거래 내역 조회 가능
CREATE POLICY "Distributors can view assigned transactions" ON guarantee_slot_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guarantee_slots gs
            WHERE gs.id = guarantee_slot_id
            AND gs.distributor_id = auth.uid()
        )
    );

-- 관리자는 모든 거래 내역 조회 가능
CREATE POLICY "Admins can view all transactions" ON guarantee_slot_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 7. guarantee_excel_templates 테이블 RLS 활성화 및 정책
ALTER TABLE guarantee_excel_templates ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 템플릿만 조회/생성/수정/삭제 가능
CREATE POLICY "Users can view own templates" ON guarantee_excel_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON guarantee_excel_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON guarantee_excel_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON guarantee_excel_templates
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 권한 설정
-- =============================================================================

-- authenticated 사용자에게 테이블 접근 권한 부여
GRANT SELECT, INSERT, UPDATE ON guarantee_slot_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guarantee_slot_negotiations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guarantee_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guarantee_slot_holdings TO authenticated;
GRANT SELECT, INSERT ON guarantee_slot_settlements TO authenticated;
GRANT SELECT ON guarantee_slot_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON guarantee_excel_templates TO authenticated;

-- 뷰에 대한 접근 권한 부여
GRANT SELECT ON guarantee_slots_status_view TO authenticated;
GRANT SELECT ON guarantee_campaigns_view TO authenticated;
GRANT SELECT ON daily_guarantee_check_view TO authenticated;
GRANT SELECT ON guarantee_requests_detail_view TO authenticated;

-- service_role에게 모든 권한 부여 (백엔드 서비스용)
GRANT ALL ON guarantee_slot_requests TO service_role;
GRANT ALL ON guarantee_slot_negotiations TO service_role;
GRANT ALL ON guarantee_slots TO service_role;
GRANT ALL ON guarantee_slot_holdings TO service_role;
GRANT ALL ON guarantee_slot_settlements TO service_role;
GRANT ALL ON guarantee_slot_transactions TO service_role;
GRANT ALL ON guarantee_excel_templates TO service_role;

-- 뷰에 대한 service_role 권한
GRANT ALL ON guarantee_slots_status_view TO service_role;
GRANT ALL ON guarantee_campaigns_view TO service_role;
GRANT ALL ON daily_guarantee_check_view TO service_role;
GRANT ALL ON guarantee_requests_detail_view TO service_role;