-- ============================================
-- 자동완료 슬롯 처리 함수
-- 작성일: 2025-01-15
-- 
-- 설명: 지정된 시간에 자동완료로 설정된 슬롯들을 처리합니다.
-- 1. 작업 100% 입력 (slot_works_info)
-- 2. 총판 완료 처리 (mat_complete_slot 호출)
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_complete_slots_by_hour(target_hour INT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := '{"processed": 0, "completed": 0, "errors": [], "slots": []}'::jsonb;
    v_slot RECORD;
    v_processed INT := 0;
    v_completed INT := 0;
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Seoul')::date;
    v_slots_info jsonb := '[]'::jsonb;
    v_completion_result jsonb;
    v_errors jsonb := '[]'::jsonb;
BEGIN
    -- 자동완료 설정된 슬롯들 처리 (진행 중인 슬롯)
    FOR v_slot IN
        SELECT 
            s.id,
            s.product_id,
            s.user_id,
            s.mat_id,
            s.quantity,
            s.start_date,
            s.end_date,
            c.campaign_name,
            c.work_completion_mode,
            c.auto_completion_hour
        FROM slots s
        JOIN campaigns c ON c.id = s.product_id
        WHERE s.status = 'approved'
        AND c.work_completion_mode = 'auto'
        AND c.auto_completion_hour = target_hour
        AND s.start_date <= v_today  -- 시작일이 오늘 이전
        AND s.end_date >= v_today     -- 종료일이 오늘 이후
        AND NOT EXISTS (
            -- 오늘 이미 작업이 입력된 슬롯은 제외
            SELECT 1 FROM slot_works_info swi 
            WHERE swi.slot_id = s.id
            AND swi.date = v_today
        )
    LOOP
        BEGIN
            -- 1. 먼저 작업 100% 입력 (notes로 자동완료 구분)
            INSERT INTO slot_works_info (
                slot_id,
                date,
                work_cnt,
                notes,
                created_at
            ) VALUES (
                v_slot.id,
                v_today,  -- 오늘 날짜로 입력
                v_slot.quantity,
                '자동완료 처리',
                NOW()
            );
            
            -- 2. 종료일인 경우에만 mat_complete_slot 함수 호출하여 완료 처리
            IF v_slot.end_date = v_today THEN
                v_completion_result := mat_complete_slot(
                    v_slot.id,
                    v_slot.mat_id,
                    format('자동완료 - %s시 처리', target_hour)
                );
            END IF;
            
            -- 처리된 슬롯 정보 추가
            v_slots_info := v_slots_info || jsonb_build_object(
                'slot_id', v_slot.id,
                'campaign_name', v_slot.campaign_name,
                'quantity', v_slot.quantity,
                'user_id', v_slot.user_id,
                'mat_id', v_slot.mat_id,
                'completion_result', v_completion_result
            );
            
            v_processed := v_processed + 1;
            
            -- 종료일이고 mat_complete_slot이 성공하면 completed 카운트 증가
            IF v_slot.end_date = v_today AND v_completion_result->>'success' = 'true' THEN
                v_completed := v_completed + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- 에러 발생 시 로그 남기고 계속 진행
            v_errors := v_errors || jsonb_build_object(
                'slot_id', v_slot.id,
                'error', SQLERRM,
                'campaign_name', v_slot.campaign_name
            );
            RAISE NOTICE '슬롯 % 처리 중 오류 발생: %', v_slot.id, SQLERRM;
        END;
    END LOOP;
    
    -- 결과 반환
    v_result := jsonb_build_object(
        'processed', v_processed,
        'completed', v_completed,
        'hour', target_hour,
        'date', v_today,
        'slots', v_slots_info,
        'errors', v_errors
    );
    
    -- 처리 결과 로그
    IF v_processed > 0 THEN
        RAISE NOTICE '자동완료 처리 완료: %시, 처리: %건, 성공: %건', 
            target_hour, v_processed, v_completed;
    END IF;
    
    RETURN v_result;
END;
$$;

-- ============================================
-- 현재 시간 기준 자동완료 실행 함수 (크론용)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_complete_slots_current_hour()
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 현재 한국 시간을 기준으로 auto_complete_slots_by_hour 함수 호출
    RETURN auto_complete_slots_by_hour(
        EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Seoul')::INT
    );
END;
$$;

-- ============================================
-- 크론 스케줄 설정
-- ============================================
-- 기존 크론 작업 제거 (있을 경우)
SELECT cron.unschedule('auto-complete-slots-hourly') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-complete-slots-hourly');

-- 매시간 실행되는 크론 작업 등록
SELECT cron.schedule(
    'auto-complete-slots-hourly', 
    '0 * * * *',  -- 매시간 0분에 실행
    'SELECT auto_complete_slots_current_hour();'
);

-- 크론 작업 확인
-- SELECT * FROM cron.job WHERE jobname = 'auto-complete-slots-hourly';

-- 함수 설명 추가
COMMENT ON FUNCTION public.auto_complete_slots_by_hour(INT) IS 
'지정된 시간에 자동완료로 설정된 슬롯들을 처리합니다. 작업을 100% 입력하고 총판 완료 처리를 수행합니다.';

-- ============================================
-- 테스트 쿼리 예시
-- ============================================
/*
-- 현재 시간(18시)에 자동완료 대상 슬롯 확인
SELECT 
    s.id,
    c.campaign_name,
    s.quantity,
    s.start_date,
    s.end_date,
    c.auto_completion_hour,
    CASE 
        WHEN s.end_date = (NOW() AT TIME ZONE 'Asia/Seoul')::date THEN '오늘 완료 예정'
        ELSE '진행 중'
    END as status
FROM slots s
JOIN campaigns c ON c.id = s.product_id
WHERE s.status = 'approved'
AND c.work_completion_mode = 'auto'
AND c.auto_completion_hour = 18
AND s.start_date <= (NOW() AT TIME ZONE 'Asia/Seoul')::date
AND s.end_date >= (NOW() AT TIME ZONE 'Asia/Seoul')::date;

-- 자동완료 함수 수동 실행
SELECT auto_complete_slots_by_hour(18);

-- 결과 확인
SELECT * FROM slot_works_info 
WHERE notes = '자동완료 처리' 
AND date = (NOW() AT TIME ZONE 'Asia/Seoul')::date
ORDER BY created_at DESC;
*/