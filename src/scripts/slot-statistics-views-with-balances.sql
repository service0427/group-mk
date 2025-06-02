-- 슬롯 통계를 위한 뷰 생성 (실제 작업량 기반 버전)
-- slot_works_info 테이블을 사용하여 실제 작업된 수량을 기준으로 매출 계산

-- 기존 뷰 삭제 (존재하는 경우)
DROP VIEW IF EXISTS v_daily_slot_statistics CASCADE;
DROP VIEW IF EXISTS v_monthly_slot_statistics CASCADE;

-- 1. 일별 슬롯 통계 뷰 (실제 작업량 기준)
CREATE VIEW v_daily_slot_statistics AS
SELECT 
    s.created_at::date as stat_date,
    s.mat_id,
    u.full_name as mat_name,
    c.service_type,
    c.id as campaign_id,
    c.campaign_name,
    COUNT(DISTINCT s.id) as slot_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('pending', 'submitted') THEN s.id END) as pending_count,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('completed', 'success', 'pending_user_confirm', 'complete') THEN s.id END) as completed_count,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_count,
    COUNT(DISTINCT CASE WHEN s.status = 'refund' THEN s.id END) as refund_count,
    COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) as cancelled_count,
    -- 요청된 총 수량
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') THEN COALESCE(s.quantity, 0) ELSE 0 END) as total_quantity,
    -- 실제 작업된 수량 (slot_works_info 기준)
    COALESCE(SUM(w.total_work_cnt), 0) as actual_worked_quantity,
    -- 실제 작업량 기반 매출 계산 (작업 수량 × 단가)
    SUM(
        CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') 
        THEN COALESCE(w.total_work_cnt, 0) * COALESCE(c.unit_price, 0)
        ELSE 0 END
    ) as total_revenue,
    -- 원래 계산된 예상 매출 (비교용)
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    ELSE 0 END) as expected_revenue
FROM slots s
INNER JOIN campaigns c ON s.product_id = c.id
LEFT JOIN users u ON s.mat_id = u.id
LEFT JOIN (
    -- 슬롯별 총 작업량 집계
    SELECT slot_id, SUM(work_cnt) as total_work_cnt
    FROM slot_works_info
    GROUP BY slot_id
) w ON s.id = w.slot_id
WHERE s.mat_id IS NOT NULL
GROUP BY s.created_at::date, s.mat_id, u.full_name, c.service_type, c.id, c.campaign_name;

-- 2. 월별 슬롯 통계 뷰 (실제 작업량 기준)
CREATE VIEW v_monthly_slot_statistics AS
SELECT 
    date_trunc('month', s.created_at) as stat_month,
    s.mat_id,
    u.full_name as mat_name,
    c.service_type,
    COUNT(DISTINCT s.id) as slot_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('pending', 'submitted') THEN s.id END) as pending_count,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('completed', 'success', 'pending_user_confirm', 'complete') THEN s.id END) as completed_count,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_count,
    COUNT(DISTINCT CASE WHEN s.status = 'refund' THEN s.id END) as refund_count,
    -- 요청된 총 수량
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') THEN COALESCE(s.quantity, 0) ELSE 0 END) as total_quantity,
    -- 실제 작업된 수량 (slot_works_info 기준)
    COALESCE(SUM(w.total_work_cnt), 0) as actual_worked_quantity,
    -- 실제 작업량 기반 매출 계산 (작업 수량 × 단가)
    SUM(
        CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') 
        THEN COALESCE(w.total_work_cnt, 0) * COALESCE(c.unit_price, 0)
        ELSE 0 END
    ) as total_revenue,
    -- 평균 매출
    AVG(
        CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') AND w.total_work_cnt > 0
        THEN w.total_work_cnt * c.unit_price
        END
    ) as avg_revenue_per_slot,
    -- 원래 계산된 예상 매출 (비교용)
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    ELSE 0 END) as expected_revenue
FROM slots s
INNER JOIN campaigns c ON s.product_id = c.id
LEFT JOIN users u ON s.mat_id = u.id
LEFT JOIN (
    -- 슬롯별 총 작업량 집계
    SELECT slot_id, SUM(work_cnt) as total_work_cnt
    FROM slot_works_info
    GROUP BY slot_id
) w ON s.id = w.slot_id
WHERE s.mat_id IS NOT NULL
GROUP BY date_trunc('month', s.created_at), s.mat_id, u.full_name, c.service_type;

-- 3. 실제 작업량과 정산 금액 비교 뷰
CREATE VIEW v_slot_revenue_comparison AS
SELECT 
    s.id as slot_id,
    s.mat_id,
    s.status,
    s.quantity as requested_daily_quantity,
    c.unit_price,
    -- 예상 일수
    CASE 
        WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
        THEN (s.end_date::date - s.start_date::date + 1)
        ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
    END as expected_days,
    -- 요청된 총 수량 (일일 수량 × 일수)
    s.quantity * COALESCE(
        CASE 
            WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
            THEN (s.end_date::date - s.start_date::date + 1)
            ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
        END, 1
    ) as requested_total_quantity,
    -- 실제 작업된 수량
    COALESCE(w.total_work_cnt, 0) as actual_worked_quantity,
    -- 작업 완료율
    CASE 
        WHEN s.quantity * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END, 1
        ) > 0 THEN
            ROUND((COALESCE(w.total_work_cnt, 0)::numeric / (s.quantity * COALESCE(
                CASE 
                    WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                    THEN (s.end_date::date - s.start_date::date + 1)
                    ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
                END, 1
            ))::numeric) * 100, 2)
        ELSE 0
    END as completion_rate,
    -- 예상 매출 (요청 수량 기준)
    COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
        CASE 
            WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
            THEN (s.end_date::date - s.start_date::date + 1)
            ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
        END, 1
    ) as expected_revenue,
    -- 실제 매출 (작업 수량 기준)
    COALESCE(w.total_work_cnt, 0) * COALESCE(c.unit_price, 0) as actual_revenue,
    -- 매출 차이
    (COALESCE(w.total_work_cnt, 0) * COALESCE(c.unit_price, 0)) - 
    (COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
        CASE 
            WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
            THEN (s.end_date::date - s.start_date::date + 1)
            ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
        END, 1
    )) as revenue_difference,
    -- slot_pending_balances 정보 (참고용)
    spb.amount as pending_balance_amount,
    spb.status as balance_status
FROM slots s
INNER JOIN campaigns c ON s.product_id = c.id
LEFT JOIN (
    -- 슬롯별 총 작업량 집계
    SELECT slot_id, SUM(work_cnt) as total_work_cnt
    FROM slot_works_info
    GROUP BY slot_id
) w ON s.id = w.slot_id
LEFT JOIN slot_pending_balances spb ON s.id = spb.slot_id
WHERE s.status IN ('approved', 'completed', 'success', 'pending_user_confirm', 'complete')
  AND s.mat_id IS NOT NULL;

-- 권한 설정
GRANT SELECT ON v_daily_slot_statistics TO authenticated;
GRANT SELECT ON v_monthly_slot_statistics TO authenticated;
GRANT SELECT ON v_slot_revenue_comparison TO authenticated;