-- =============================================================================
-- 보장형 슬롯 시스템 데이터 초기화
-- 작성일: 2025-06-16
-- 설명: 보장형 관련 테이블의 데이터만 삭제 (테이블 구조는 유지)
-- =============================================================================

-- 외래키 제약 조건 때문에 순서대로 삭제해야 함

-- 1. 거래 내역 테이블 데이터 삭제
DELETE FROM guarantee_slot_transactions;

-- 2. 정산 내역 테이블 데이터 삭제
DELETE FROM guarantee_slot_settlements;

-- 3. 홀딩 금액 관리 테이블 데이터 삭제
DELETE FROM guarantee_slot_holdings;

-- 4. 보장성 슬롯 메인 테이블 데이터 삭제
DELETE FROM guarantee_slots;

-- 5. 협상 메시지 테이블 데이터 삭제
DELETE FROM guarantee_slot_negotiations;

-- 6. 보장성 슬롯 견적 요청 테이블 데이터 삭제 (마지막에 삭제)
DELETE FROM guarantee_slot_requests;

-- 시퀀스 리셋 (AUTO_INCREMENT가 있는 경우)
-- PostgreSQL에서는 SERIAL 타입의 시퀀스를 리셋할 수 있지만, 
-- 현재 테이블들은 모두 UUID를 사용하므로 시퀀스 리셋은 불필요

-- 작업 완료 확인
SELECT 
    'guarantee_slot_requests' as table_name,
    COUNT(*) as remaining_records
FROM guarantee_slot_requests
UNION ALL
SELECT 
    'guarantee_slot_negotiations' as table_name,
    COUNT(*) as remaining_records
FROM guarantee_slot_negotiations
UNION ALL
SELECT 
    'guarantee_slots' as table_name,
    COUNT(*) as remaining_records
FROM guarantee_slots
UNION ALL
SELECT 
    'guarantee_slot_holdings' as table_name,
    COUNT(*) as remaining_records
FROM guarantee_slot_holdings
UNION ALL
SELECT 
    'guarantee_slot_settlements' as table_name,
    COUNT(*) as remaining_records
FROM guarantee_slot_settlements
UNION ALL
SELECT 
    'guarantee_slot_transactions' as table_name,
    COUNT(*) as remaining_records
FROM guarantee_slot_transactions;

-- 초기화 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '보장형 슬롯 시스템 데이터 초기화 완료';
    RAISE NOTICE '- campaigns 테이블은 유지됨';
    RAISE NOTICE '- keywords 테이블은 유지됨';
    RAISE NOTICE '- users 테이블은 유지됨';
    RAISE NOTICE '- 테이블 구조는 모두 유지됨';
END $$;