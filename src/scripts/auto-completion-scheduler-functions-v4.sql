-- ============================================
-- 스케줄러용 자동 완료 함수들 V4
-- ============================================
-- 1. 총판이 작업 완료일이 N일 지나도 완료를 누르지 않았을 경우 자동으로 완료 및 캐시 환불
-- 2. 사용자가 총판이 완료처리를 했는데 거래완료를 N일 동안 안할경우 자동으로 거래 완료 및 캐시 지급
-- ============================================
-- V4 수정사항: end_date와 dueDays를 고려하여 실제 작업 기한이 지난 경우에만 자동 완료
-- ============================================

-- ============================================
-- 1. 총판 자동 완료 함수 - 잘못된 버전 (campaign_id 사용)
-- 이 함수는 오류가 있으므로 auto-complete-overdue-slots-fixed.sql을 사용하세요
-- ============================================
-- 이 함수는 s.campaign_id를 사용하여 오류가 발생합니다.
-- 올바른 버전은 auto-complete-overdue-slots-fixed.sql을 참조하세요.

-- ============================================
-- 2. 사용자 자동 거래완료 함수 - 구버전
-- 이 함수는 타임존 처리가 없으므로 auto-confirm-completed-slots-fixed.sql을 사용하세요
-- ============================================
-- 이 함수는 타임존 처리가 없고 notifications 테이블의 컬럼명이 다를 수 있습니다.
-- 올바른 버전은 auto-confirm-completed-slots-fixed.sql을 참조하세요.

-- ============================================
-- 스케줄러 설정 예시 (pg_cron 사용시)
-- ============================================
-- 매일 새벽 1시에 자동 완료 실행 (작업 기한 후 2일 경과 기준)
-- SELECT cron.schedule('auto-complete-overdue-slots', '0 1 * * *', 'SELECT auto_complete_overdue_slots(2);');

-- 매일 새벽 2시에 자동 거래완료 실행 (총판 완료 후 2일 경과 기준)  
-- SELECT cron.schedule('auto-confirm-completed-slots', '0 2 * * *', 'SELECT auto_confirm_completed_slots(2);');