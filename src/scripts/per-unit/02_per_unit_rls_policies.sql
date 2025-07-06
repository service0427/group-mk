-- =====================================================
-- 단건형(Per-Unit) 캠페인 RLS(Row Level Security) 정책
-- =====================================================
-- 설명: 각 역할별 데이터 접근 권한 정의
-- 작성일: 2025-07-06
-- =====================================================

-- 역할별 권한 매트릭스:
-- Developer/Operator: 모든 데이터 접근 가능
-- Distributor: 자신이 담당하는 캠페인과 관련 데이터
-- Agency/Advertiser: 자신의 구매/문의 데이터
-- Beginner: 읽기 전용 (일부)

-- =====================================================
-- 1. per_unit_campaigns 정책
-- =====================================================

-- 모든 사용자가 활성 캠페인 조회 가능
CREATE POLICY "per_unit_campaigns_select_active" ON per_unit_campaigns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_id
            AND c.status = 'active'
        )
    );

-- 개발자/운영자는 모든 캠페인 관리 가능
CREATE POLICY "per_unit_campaigns_admin_all" ON per_unit_campaigns
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- 총판은 자신의 캠페인만 관리 가능
CREATE POLICY "per_unit_campaigns_distributor_own" ON per_unit_campaigns
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_id
            AND c.mat_id = auth.uid()
        )
    );

-- =====================================================
-- 2. per_unit_slot_requests 정책
-- =====================================================

-- 사용자는 자신의 견적 요청 조회/생성 가능
CREATE POLICY "per_unit_slot_requests_user_own" ON per_unit_slot_requests
    FOR ALL
    USING (user_id = auth.uid());

-- 총판은 자신에게 할당된 요청 조회/수정 가능
CREATE POLICY "per_unit_slot_requests_distributor" ON per_unit_slot_requests
    FOR ALL
    USING (distributor_id = auth.uid());

-- 개발자/운영자는 모든 요청 관리 가능
CREATE POLICY "per_unit_slot_requests_admin" ON per_unit_slot_requests
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 3. per_unit_negotiations 정책
-- =====================================================

-- 협상 참여자만 메시지 조회 가능
CREATE POLICY "per_unit_negotiations_participants" ON per_unit_negotiations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slot_requests r
            WHERE r.id = request_id
            AND (r.user_id = auth.uid() OR r.distributor_id = auth.uid())
        )
    );

-- 협상 참여자만 메시지 작성 가능
CREATE POLICY "per_unit_negotiations_insert" ON per_unit_negotiations
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM per_unit_slot_requests r
            WHERE r.id = request_id
            AND (r.user_id = auth.uid() OR r.distributor_id = auth.uid())
        )
    );

-- 개발자/운영자는 모든 협상 조회 가능
CREATE POLICY "per_unit_negotiations_admin" ON per_unit_negotiations
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 4. per_unit_slots 정책
-- =====================================================

-- 사용자는 자신의 슬롯 조회 가능
CREATE POLICY "per_unit_slots_user_own" ON per_unit_slots
    FOR SELECT
    USING (user_id = auth.uid());

-- 총판은 자신이 담당하는 슬롯 관리 가능
CREATE POLICY "per_unit_slots_distributor" ON per_unit_slots
    FOR ALL
    USING (distributor_id = auth.uid());

-- 개발자/운영자는 모든 슬롯 관리 가능
CREATE POLICY "per_unit_slots_admin" ON per_unit_slots
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 5. per_unit_work_logs 정책
-- =====================================================

-- 슬롯 소유자는 작업 실적 조회 가능
CREATE POLICY "per_unit_work_logs_user_view" ON per_unit_work_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND s.user_id = auth.uid()
        )
    );

-- 총판은 자신의 슬롯 작업 실적 관리 가능
CREATE POLICY "per_unit_work_logs_distributor" ON per_unit_work_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND s.distributor_id = auth.uid()
        )
    );

-- 개발자/운영자는 모든 작업 실적 관리 가능
CREATE POLICY "per_unit_work_logs_admin" ON per_unit_work_logs
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 6. per_unit_holdings 정책
-- =====================================================

-- 슬롯 관련자만 홀딩 정보 조회 가능
CREATE POLICY "per_unit_holdings_related" ON per_unit_holdings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND (s.user_id = auth.uid() OR s.distributor_id = auth.uid())
        )
    );

-- 개발자/운영자만 홀딩 정보 수정 가능
CREATE POLICY "per_unit_holdings_admin" ON per_unit_holdings
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 7. per_unit_inquiries 정책
-- =====================================================

-- 사용자는 자신의 문의 관리 가능
CREATE POLICY "per_unit_inquiries_user_own" ON per_unit_inquiries
    FOR ALL
    USING (user_id = auth.uid());

-- 총판은 자신의 슬롯 관련 문의 조회 가능
CREATE POLICY "per_unit_inquiries_distributor" ON per_unit_inquiries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND s.distributor_id = auth.uid()
        )
    );

-- 개발자/운영자는 모든 문의 관리 가능
CREATE POLICY "per_unit_inquiries_admin" ON per_unit_inquiries
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 8. per_unit_inquiry_messages 정책
-- =====================================================

-- 문의 참여자만 메시지 조회 가능
CREATE POLICY "per_unit_inquiry_messages_participants" ON per_unit_inquiry_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_inquiries i
            WHERE i.id = inquiry_id
            AND (
                i.user_id = auth.uid() OR 
                i.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM per_unit_slots s
                    WHERE s.id = i.slot_id
                    AND s.distributor_id = auth.uid()
                )
            )
        )
    );

-- 메시지 작성 권한
CREATE POLICY "per_unit_inquiry_messages_insert" ON per_unit_inquiry_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM per_unit_inquiries i
            WHERE i.id = inquiry_id
            AND (
                i.user_id = auth.uid() OR 
                i.assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM per_unit_slots s
                    WHERE s.id = i.slot_id
                    AND s.distributor_id = auth.uid()
                ) OR
                auth.uid() IN (
                    SELECT id FROM users 
                    WHERE role IN ('Developer', 'Operator')
                )
            )
        )
    );

-- =====================================================
-- 9. per_unit_refund_requests 정책
-- =====================================================

-- 사용자는 자신의 환불 요청 관리 가능
CREATE POLICY "per_unit_refund_requests_user_own" ON per_unit_refund_requests
    FOR ALL
    USING (user_id = auth.uid());

-- 총판은 자신의 슬롯 환불 요청 조회 가능
CREATE POLICY "per_unit_refund_requests_distributor" ON per_unit_refund_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND s.distributor_id = auth.uid()
        )
    );

-- 개발자/운영자는 모든 환불 요청 관리 가능
CREATE POLICY "per_unit_refund_requests_admin" ON per_unit_refund_requests
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 10. per_unit_settlements 정책
-- =====================================================

-- 슬롯 관련자만 정산 정보 조회 가능
CREATE POLICY "per_unit_settlements_view" ON per_unit_settlements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND (s.user_id = auth.uid() OR s.distributor_id = auth.uid())
        )
    );

-- 개발자/운영자만 정산 정보 수정 가능
CREATE POLICY "per_unit_settlements_admin" ON per_unit_settlements
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 11. per_unit_transactions 정책
-- =====================================================

-- 사용자는 자신의 거래 내역 조회 가능
CREATE POLICY "per_unit_transactions_user_own" ON per_unit_transactions
    FOR SELECT
    USING (user_id = auth.uid());

-- 총판은 자신의 슬롯 관련 거래 조회 가능
CREATE POLICY "per_unit_transactions_distributor" ON per_unit_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM per_unit_slots s
            WHERE s.id = slot_id
            AND s.distributor_id = auth.uid()
        )
    );

-- 개발자/운영자는 모든 거래 내역 조회 가능
CREATE POLICY "per_unit_transactions_admin" ON per_unit_transactions
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('Developer', 'Operator')
        )
    );

-- =====================================================
-- 완료 메시지
-- =====================================================
-- 단건형 캠페인 RLS 정책 적용이 완료되었습니다.
-- 다음 단계: 함수 및 트리거 생성 (03_per_unit_functions.sql)