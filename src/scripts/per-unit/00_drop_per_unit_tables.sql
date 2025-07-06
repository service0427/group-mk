-- =====================================================
-- 단건형(Per-Unit) 캠페인 테이블 삭제 스크립트
-- =====================================================
-- 설명: 기존 단건형 캠페인 관련 테이블 및 객체 삭제
-- 작성일: 2025-07-06
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!
-- =====================================================

-- 1. 뷰(View) 삭제
DROP VIEW IF EXISTS v_per_unit_daily_work CASCADE;
DROP VIEW IF EXISTS v_per_unit_slot_summary CASCADE;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS daily_per_unit_settlement_batch() CASCADE;
DROP FUNCTION IF EXISTS create_per_unit_refund(UUID, VARCHAR, VARCHAR, TEXT, INTEGER, JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_per_unit_settlement(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS approve_per_unit_work_log(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS submit_per_unit_work_log(UUID, DATE, INTEGER, JSONB, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS purchase_per_unit_slot(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS respond_per_unit_request(UUID, VARCHAR, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_per_unit_request(INTEGER, INTEGER, NUMERIC, TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS create_per_unit_campaign(INTEGER, INTEGER, NUMERIC, INTEGER, INTEGER, BOOLEAN, NUMERIC, NUMERIC, TEXT, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS expire_old_requests() CASCADE;
DROP FUNCTION IF EXISTS handle_slot_status_change() CASCADE;

-- 3. 트리거 삭제
DROP TRIGGER IF EXISTS trigger_slot_status_change ON per_unit_slots CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_campaigns_updated_at ON per_unit_campaigns CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_slot_requests_updated_at ON per_unit_slot_requests CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_slots_updated_at ON per_unit_slots CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_work_logs_updated_at ON per_unit_work_logs CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_inquiries_updated_at ON per_unit_inquiries CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_refund_requests_updated_at ON per_unit_refund_requests CASCADE;
DROP TRIGGER IF EXISTS update_per_unit_settlements_updated_at ON per_unit_settlements CASCADE;

-- 4. 테이블 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS per_unit_transactions CASCADE;
DROP TABLE IF EXISTS per_unit_settlements CASCADE;
DROP TABLE IF EXISTS per_unit_refund_requests CASCADE;
DROP TABLE IF EXISTS per_unit_inquiry_messages CASCADE;
DROP TABLE IF EXISTS per_unit_inquiries CASCADE;
DROP TABLE IF EXISTS per_unit_holdings CASCADE;
DROP TABLE IF EXISTS per_unit_work_logs CASCADE;
DROP TABLE IF EXISTS per_unit_slots CASCADE;
DROP TABLE IF EXISTS per_unit_negotiations CASCADE;
DROP TABLE IF EXISTS per_unit_slot_requests CASCADE;
DROP TABLE IF EXISTS per_unit_campaigns CASCADE;

-- 5. 인덱스 삭제 (테이블 삭제 시 자동으로 삭제되지만 명시적으로 포함)
-- 테이블이 삭제되면 인덱스도 자동으로 삭제됨

-- =====================================================
-- 완료 메시지
-- =====================================================
-- 단건형 캠페인 관련 모든 객체가 삭제되었습니다.
-- 다음 단계: 테이블 재생성 (01_create_per_unit_tables.sql)