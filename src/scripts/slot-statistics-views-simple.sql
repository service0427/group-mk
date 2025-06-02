-- 슬롯 통계를 위한 뷰 생성 (인덱스 없는 버전)

-- 기존 뷰 삭제 (존재하는 경우)
DROP VIEW IF EXISTS v_daily_slot_statistics CASCADE;
DROP VIEW IF EXISTS v_monthly_slot_statistics CASCADE;
DROP VIEW IF EXISTS v_slot_work_progress CASCADE;
DROP VIEW IF EXISTS v_campaign_slot_statistics CASCADE;
DROP VIEW IF EXISTS v_user_slot_statistics CASCADE;

-- 1. 일별 슬롯 통계 뷰
CREATE VIEW v_daily_slot_statistics AS
SELECT 
    s.created_at::date as stat_date,
    s.mat_id,
    c.service_type,
    c.id as campaign_id,
    c.campaign_name,
    COUNT(DISTINCT s.id) as slot_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('pending', 'submitted') THEN s.id END) as pending_count,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('completed', 'success', 'pending_user_confirm') THEN s.id END) as completed_count,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_count,
    COUNT(DISTINCT CASE WHEN s.status = 'refund' THEN s.id END) as refund_count,
    COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) as cancelled_count,
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN COALESCE(s.quantity, 0) ELSE 0 END) as total_quantity,
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    ELSE 0 END) as total_revenue
FROM slots s
INNER JOIN campaigns c ON s.product_id = c.id
GROUP BY s.created_at::date, s.mat_id, c.service_type, c.id, c.campaign_name;

-- 2. 월별 슬롯 통계 뷰
CREATE VIEW v_monthly_slot_statistics AS
SELECT 
    date_trunc('month', s.created_at) as stat_month,
    s.mat_id,
    c.service_type,
    COUNT(DISTINCT s.id) as slot_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('pending', 'submitted') THEN s.id END) as pending_count,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status IN ('completed', 'success', 'pending_user_confirm') THEN s.id END) as completed_count,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_count,
    COUNT(DISTINCT CASE WHEN s.status = 'refund' THEN s.id END) as refund_count,
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN COALESCE(s.quantity, 0) ELSE 0 END) as total_quantity,
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    ELSE 0 END) as total_revenue,
    AVG(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    END) as avg_revenue_per_slot
FROM slots s
INNER JOIN campaigns c ON s.product_id = c.id
GROUP BY date_trunc('month', s.created_at), s.mat_id, c.service_type;

-- 3. 작업 진행률 통계 뷰
CREATE VIEW v_slot_work_progress AS
SELECT 
    s.id as slot_id,
    s.mat_id,
    s.product_id,
    s.user_id,
    s.status,
    s.quantity as daily_quantity,
    s.start_date,
    s.end_date,
    COALESCE(
        CASE 
            WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
            THEN (s.end_date::date - s.start_date::date + 1)
            ELSE CAST(s.input_data->>'dueDays' AS INTEGER)
        END, 
        1
    ) as total_days,
    COUNT(DISTINCT w.date) as worked_days,
    COALESCE(SUM(w.work_cnt), 0) as total_worked_quantity,
    COALESCE(s.quantity, 0) * COALESCE(
        CASE 
            WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
            THEN (s.end_date::date - s.start_date::date + 1)
            ELSE CAST(s.input_data->>'dueDays' AS INTEGER)
        END, 
        1
    ) as total_requested_quantity,
    CASE 
        WHEN COALESCE(s.quantity, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE CAST(s.input_data->>'dueDays' AS INTEGER)
            END, 
            1
        ) > 0 THEN
            LEAST(100, ROUND((COALESCE(SUM(w.work_cnt), 0)::numeric / 
            (COALESCE(s.quantity, 0) * COALESCE(
                CASE 
                    WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                    THEN (s.end_date::date - s.start_date::date + 1)
                    ELSE CAST(s.input_data->>'dueDays' AS INTEGER)
                END, 
                1
            ))::numeric) * 100, 2))
        ELSE 0
    END as completion_rate
FROM slots s
LEFT JOIN slot_works_info w ON s.id = w.slot_id
GROUP BY s.id, s.mat_id, s.product_id, s.user_id, s.status, 
         s.quantity, s.start_date, s.end_date, s.input_data;

-- 4. 캠페인별 슬롯 통계 뷰
CREATE VIEW v_campaign_slot_statistics AS
SELECT 
    c.id as campaign_id,
    c.campaign_name,
    c.service_type,
    c.mat_id,
    COUNT(DISTINCT s.id) as total_slots,
    COUNT(DISTINCT CASE WHEN s.status IN ('pending', 'submitted') THEN s.id END) as pending_slots,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_slots,
    COUNT(DISTINCT CASE WHEN s.status IN ('completed', 'success', 'pending_user_confirm') THEN s.id END) as completed_slots,
    COUNT(DISTINCT s.user_id) as unique_users,
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    ELSE 0 END) as total_revenue,
    AVG(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN 
        COALESCE(s.quantity, 0) 
    END) as avg_quantity_per_slot
FROM campaigns c
LEFT JOIN slots s ON c.id = s.product_id
GROUP BY c.id, c.campaign_name, c.service_type, c.mat_id;

-- 5. 사용자별 슬롯 통계 뷰
CREATE VIEW v_user_slot_statistics AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT s.id) as total_slots,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as active_slots,
    COUNT(DISTINCT CASE WHEN s.status IN ('completed', 'success', 'pending_user_confirm') THEN s.id END) as completed_slots,
    COUNT(DISTINCT s.product_id) as unique_campaigns,
    SUM(CASE WHEN s.status IN ('approved', 'completed', 'success', 'pending_user_confirm') THEN 
        COALESCE(s.quantity, 0) * COALESCE(c.unit_price, 0) * COALESCE(
            CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN (s.end_date::date - s.start_date::date + 1)
                ELSE COALESCE(CAST(s.input_data->>'dueDays' AS INTEGER), 1)
            END
        )
    ELSE 0 END) as total_spent
FROM users u
LEFT JOIN slots s ON u.id = s.user_id
LEFT JOIN campaigns c ON s.product_id = c.id
GROUP BY u.id, u.full_name, u.email;

-- 권한 설정
GRANT SELECT ON v_daily_slot_statistics TO authenticated;
GRANT SELECT ON v_monthly_slot_statistics TO authenticated;
GRANT SELECT ON v_slot_work_progress TO authenticated;
GRANT SELECT ON v_campaign_slot_statistics TO authenticated;
GRANT SELECT ON v_user_slot_statistics TO authenticated;