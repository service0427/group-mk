-- ============================================
-- 총판 자동 완료 기능 확인 쿼리 모음
-- ============================================

-- 1. 자동 완료 대상이 되는 슬롯들 확인 (기본 7일 기준)
-- 이 쿼리는 auto_complete_overdue_slots 함수에서 처리할 대상을 보여줍니다

  WITH overdue_slots AS (
      SELECT
          s.id as slot_id,
          s.user_id,
          s.mat_id,
          c.campaign_name,
          u.full_name as user_name,
          m.full_name as mat_name,
          s.end_date,
          s.submitted_at,
          s.status,
          -- input_data에서 dueDays 추출
          COALESCE(
              (s.input_data->>'dueDays')::INT,
              CASE
                  WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL
                  THEN (s.end_date::DATE - s.start_date::DATE) + 1
                  ELSE NULL
              END
          ) as due_days,
          (SELECT MAX(swi.date) FROM slot_works_info swi WHERE swi.slot_id = s.id) as last_work_date,
          -- 자동 완료 대상 여부 판단 (2일 기준)
          CASE
              -- end_date가 있고 2일 지난 경우
              WHEN s.end_date IS NOT NULL AND s.end_date < CURRENT_DATE - INTERVAL '2 days'
              THEN '작업기한(end_date) 2일 경과'

              -- end_date 없지만 dueDays 있고, submitted_at + dueDays + 2일 지난 경우
              WHEN s.end_date IS NULL
                  AND s.input_data->>'dueDays' IS NOT NULL
                  AND s.submitted_at < NOW() - INTERVAL '1 day' * ((s.input_data->>'dueDays')::INT + 2)
              THEN 'submitted_at + dueDays + 2일 경과'

              -- end_date도 dueDays도 없고, 마지막 작업일 2일 경과
              WHEN s.end_date IS NULL
                  AND (s.input_data->>'dueDays' IS NULL OR s.input_data->>'dueDays' = '')
                  AND EXISTS (
                      SELECT 1 FROM slot_works_info swi
                      WHERE swi.slot_id = s.id
                      GROUP BY swi.slot_id
                      HAVING MAX(swi.date) < CURRENT_DATE - INTERVAL '2 days'
                  )
              THEN '마지막 작업일 2일 경과'

              -- end_date도 dueDays도 없고, 작업도 없고, 승인일 2일 경과
              WHEN s.end_date IS NULL
                  AND (s.input_data->>'dueDays' IS NULL OR s.input_data->>'dueDays' = '')
                  AND NOT EXISTS (SELECT 1 FROM slot_works_info swi WHERE swi.slot_id = s.id)
                  AND s.submitted_at < NOW() - INTERVAL '2 days'
              THEN '작업 없음, 승인일 2일 경과'

              ELSE '대상 아님'
          END as auto_complete_reason
      FROM public.slots s
      JOIN public.users u ON u.id = s.user_id
      LEFT JOIN public.users m ON m.id = s.mat_id
      JOIN public.campaigns c ON c.id = s.product_id
      WHERE s.status = 'approved'
  )
  SELECT
      slot_id,
      user_name,
      mat_name,
      campaign_name,
      status,
      end_date,
      submitted_at,
      due_days,
      last_work_date,
      auto_complete_reason
  FROM overdue_slots
  WHERE auto_complete_reason != '대상 아님'
  ORDER BY submitted_at;

-- 3. approved 상태 슬롯 중 작업 정보 확인
SELECT 
    s.id as slot_id,
    u.full_name as user_name,
    m.full_name as mat_name,
    c.campaign_name,
    s.status,
    s.submitted_at,
    s.end_date,
    s.input_data->>'dueDays' as due_days,
    COUNT(swi.id) as work_count,
    MAX(swi.date) as last_work_date,
    CASE 
        WHEN MAX(swi.date) IS NOT NULL THEN 
            CURRENT_DATE - MAX(swi.date)::DATE
        ELSE 
            NULL 
    END as days_since_last_work
FROM slots s
JOIN users u ON u.id = s.user_id
LEFT JOIN users m ON m.id = s.mat_id
JOIN campaigns c ON c.id = s.product_id
LEFT JOIN slot_works_info swi ON swi.slot_id = s.id
WHERE s.status = 'approved'
GROUP BY s.id, u.full_name, m.full_name, c.campaign_name, s.status, s.submitted_at, s.end_date, s.input_data
ORDER BY days_since_last_work DESC NULLS FIRST;

-- 4. 자동 완료 함수 실행 테스트 (DRY RUN - 실제로 변경하지 않고 대상만 확인)
SELECT * FROM auto_complete_overdue_slots(7);

-- 5. 슬롯 히스토리 로그에서 자동 완료 관련 기록 확인
SELECT 
    shl.id,
    shl.slot_id,
    s.id as current_slot_id,
    u.full_name as user_name,
    shl.action,
    shl.old_status,
    shl.new_status,
    shl.details,
    shl.created_at
FROM slot_history_logs shl
JOIN slots s ON s.id = shl.slot_id
JOIN users u ON u.id = shl.user_id
WHERE shl.details::text LIKE '%자동 완료%'
   OR shl.action = 'mat_complete'
ORDER BY shl.created_at DESC
LIMIT 50;

-- 6. pending_user_confirm 상태 슬롯 확인 (사용자 자동 거래완료 대상)
SELECT 
    s.id as slot_id,
    u.full_name as user_name,
    m.full_name as mat_name,
    c.campaign_name,
    s.status,
    (SELECT shl.created_at 
     FROM slot_history_logs shl 
     WHERE shl.slot_id = s.id AND shl.action = 'mat_complete' 
     ORDER BY shl.created_at DESC LIMIT 1) as mat_completed_at,
    CURRENT_TIMESTAMP - (SELECT shl.created_at 
                        FROM slot_history_logs shl 
                        WHERE shl.slot_id = s.id AND shl.action = 'mat_complete' 
                        ORDER BY shl.created_at DESC LIMIT 1) as time_since_mat_complete
FROM slots s
JOIN users u ON u.id = s.user_id
JOIN users m ON m.id = s.mat_id
JOIN campaigns c ON c.id = s.product_id
WHERE s.status = 'pending_user_confirm'
ORDER BY mat_completed_at;

-- 7. 슬롯 펜딩 밸런스 상태 확인
SELECT 
    spb.status,
    COUNT(*) as count,
    SUM(spb.amount) as total_amount
FROM slot_pending_balances spb
GROUP BY spb.status;

-- 8. 최근 7일 내 완료된 슬롯 확인
SELECT 
    s.id as slot_id,
    u.full_name as user_name,
    m.full_name as mat_name,
    c.campaign_name,
    s.status,
    s.processed_at,
    shl.details
FROM slots s
JOIN users u ON u.id = s.user_id
LEFT JOIN users m ON m.id = s.mat_id
JOIN campaigns c ON c.id = s.product_id
LEFT JOIN slot_history_logs shl ON shl.slot_id = s.id 
    AND shl.action = 'mat_complete'
    AND shl.created_at >= NOW() - INTERVAL '7 days'
WHERE s.status = 'completed'
  AND s.processed_at >= NOW() - INTERVAL '7 days'
ORDER BY s.processed_at DESC;

-- 9. 특정 유저의 슬롯 상태 확인 (user_id를 변경해서 사용)
-- SELECT 
--     s.id as slot_id,
--     c.campaign_name,
--     s.status,
--     s.submitted_at,
--     s.end_date,
--     s.input_data->>'dueDays' as due_days,
--     s.processed_at
-- FROM slots s
-- JOIN campaigns c ON c.id = s.product_id
-- WHERE s.user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY s.submitted_at DESC;