-- 슬롯 완료 처리 관련 함수들 (사용자 확인 절차 포함 버전)
-- 주의: 실제 테이블 구조에 맞게 수정됨
-- slots 테이블에 mat_completed_at 컬럼 추가 필요
-- user_cash_history 테이블 구조에 맞게 수정
-- slot_pending_balances 활용하여 정산 처리

-- 주의: auto_complete_overdue_slots 함수는 auto-complete-overdue-slots-fixed.sql을 사용하세요

-- 1. 슬롯의 작업 완료율 및 작업 일수 계산 함수 (기존과 동일)
CREATE OR REPLACE FUNCTION calculate_slot_work_summary(p_slot_id UUID)
RETURNS TABLE (
    total_requested_days INTEGER,
    total_worked_days INTEGER,
    total_requested_quantity INTEGER,
    total_worked_quantity INTEGER,
    completion_rate NUMERIC,
    work_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH slot_info AS (
        -- 슬롯 기본 정보
        SELECT 
            s.id,
            s.quantity::INTEGER as daily_quantity,  -- 1일 작업량
            s.start_date,
            s.end_date,
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    (s.end_date - s.start_date + 1)
                ELSE 0
            END as requested_days,
            -- 총 요청 수량 = 1일 작업량 × 작업 일수
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    s.quantity::INTEGER * (s.end_date - s.start_date + 1)
                ELSE 
                    s.quantity::INTEGER
            END as total_requested_quantity
        FROM slots s
        WHERE s.id = p_slot_id
    ),
    work_summary AS (
        -- 실제 작업 내역 집계
        SELECT 
            swi.slot_id,
            COUNT(DISTINCT swi.date) as worked_days,
            SUM(swi.work_cnt) as total_work_cnt,
            jsonb_agg(
                jsonb_build_object(
                    'date', swi.date,
                    'work_cnt', swi.work_cnt,
                    'notes', swi.notes
                ) ORDER BY swi.date
            ) as work_details
        FROM slot_works_info swi
        WHERE swi.slot_id = p_slot_id
        GROUP BY swi.slot_id
    )
    SELECT 
        si.requested_days::INTEGER as total_requested_days,
        COALESCE(ws.worked_days, 0)::INTEGER as total_worked_days,
        si.total_requested_quantity::INTEGER as total_requested_quantity,
        COALESCE(ws.total_work_cnt, 0)::INTEGER as total_worked_quantity,
        CASE 
            WHEN si.total_requested_quantity > 0 THEN 
                ROUND((COALESCE(ws.total_work_cnt, 0)::NUMERIC / si.total_requested_quantity::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_rate,
        COALESCE(ws.work_details, '[]'::jsonb) as work_details
    FROM slot_info si
    LEFT JOIN work_summary ws ON si.id = ws.slot_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 슬롯 완료 시 정산 금액 계산 함수 (기존과 동일)
CREATE OR REPLACE FUNCTION calculate_slot_settlement(p_slot_id UUID)
RETURNS TABLE (
    slot_id UUID,
    campaign_id INTEGER,
    unit_price NUMERIC,
    total_quantity INTEGER,
    worked_quantity INTEGER,
    base_amount NUMERIC,
    user_payment_amount NUMERIC,
    refund_amount NUMERIC,
    settlement_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH slot_campaign_info AS (
        -- 슬롯과 캠페인 정보 조인
        SELECT 
            s.id as slot_id,
            s.product_id as campaign_id,
            s.quantity::INTEGER as daily_quantity,  -- 1일 작업량
            s.user_id,
            s.mat_id,
            c.unit_price::NUMERIC,
            c.campaign_name,
            c.service_type,
            s.start_date,
            s.end_date,
            -- 총 요청 수량 = 1일 작업량 × 작업 일수
            CASE 
                WHEN s.start_date IS NOT NULL AND s.end_date IS NOT NULL THEN
                    s.quantity::INTEGER * (s.end_date - s.start_date + 1)
                ELSE 
                    s.quantity::INTEGER
            END as total_requested_quantity
        FROM slots s
        JOIN campaigns c ON s.product_id = c.id
        WHERE s.id = p_slot_id
    ),
    work_summary AS (
        -- 작업 내역 집계
        SELECT 
            swi.slot_id,
            SUM(swi.work_cnt) as total_worked
        FROM slot_works_info swi
        WHERE swi.slot_id = p_slot_id
        GROUP BY swi.slot_id
    )
    SELECT 
        sci.slot_id,
        sci.campaign_id,
        sci.unit_price,
        sci.total_requested_quantity as total_quantity,
        COALESCE(ws.total_worked, 0)::INTEGER as worked_quantity,
        -- 부가세 10% 포함 계산
        sci.unit_price * sci.total_requested_quantity * 1.1 as base_amount,
        -- 총판 지급 (부가세 포함)
        sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC * 1.1 as user_payment_amount,
        -- 미완료분 환불 (부가세 포함)
        CASE 
            WHEN COALESCE(ws.total_worked, 0) < sci.total_requested_quantity THEN
                sci.unit_price * (sci.total_requested_quantity - COALESCE(ws.total_worked, 0)) * 1.1
            ELSE 0
        END as refund_amount,
        jsonb_build_object(
            'campaign_name', sci.campaign_name,
            'service_type', sci.service_type,
            'unit_price', sci.unit_price,
            'daily_quantity', sci.daily_quantity,
            'work_days', CASE 
                WHEN sci.start_date IS NOT NULL AND sci.end_date IS NOT NULL THEN
                    sci.end_date - sci.start_date + 1
                ELSE 0
            END,
            'requested_quantity', sci.total_requested_quantity,
            'completed_quantity', COALESCE(ws.total_worked, 0),
            'completion_rate', 
                CASE 
                    WHEN sci.total_requested_quantity > 0 THEN 
                        ROUND((COALESCE(ws.total_worked, 0)::NUMERIC / sci.total_requested_quantity::NUMERIC) * 100, 2)
                    ELSE 0
                END,
            'calculation_breakdown', jsonb_build_object(
                'total_cost', sci.unit_price * sci.total_requested_quantity * 1.1,  -- 부가세 포함
                'total_cost_without_vat', sci.unit_price * sci.total_requested_quantity,  -- 부가세 제외
                'vat_amount', sci.unit_price * sci.total_requested_quantity * 0.1,  -- 부가세
                'worked_cost', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC * 1.1,  -- 총판 지급 (부가세 포함)
                'worked_cost_without_vat', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC,  -- 총판 지급 (부가세 제외)
                'user_payment', sci.unit_price * COALESCE(ws.total_worked, 0)::NUMERIC * 1.1,  -- 총판 지급 (부가세 포함)
                'refund', sci.unit_price * GREATEST(0, sci.total_requested_quantity - COALESCE(ws.total_worked, 0)) * 1.1,  -- 환불 (부가세 포함)
                'refund_without_vat', sci.unit_price * GREATEST(0, sci.total_requested_quantity - COALESCE(ws.total_worked, 0))  -- 환불 (부가세 제외)
            )
        ) as settlement_details
    FROM slot_campaign_info sci
    LEFT JOIN work_summary ws ON sci.slot_id = ws.slot_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 총판의 슬롯 완료 처리 함수 (캐시 이동 없음, 대기 상태로만 변경)
CREATE OR REPLACE FUNCTION mat_complete_slot(
    p_slot_id UUID,
    p_mat_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_slot_record RECORD;
    v_settlement RECORD;
    v_work_summary RECORD;
    v_result JSONB;
BEGIN
    -- 트랜잭션 시작
    
    -- 1. 슬롯 정보 확인
    SELECT * INTO v_slot_record
    FROM slots
    WHERE id = p_slot_id AND mat_id = p_mat_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다. slot_id: %, mat_id: %', p_slot_id, p_mat_id;
    END IF;
    
    IF v_slot_record.status != 'approved' THEN
        RAISE EXCEPTION '승인된 슬롯만 완료 처리할 수 있습니다. 현재 상태: %', v_slot_record.status;
    END IF;
    
    -- 2. 작업 내역 요약 정보 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 3. 정산 금액 계산
    SELECT * INTO v_settlement
    FROM calculate_slot_settlement(p_slot_id);
    
    -- 4. 슬롯 상태를 'pending_user_confirm'으로 업데이트
    UPDATE slots
    SET 
        status = 'pending_user_confirm',
        updated_at = NOW()
    WHERE id = p_slot_id;
    
    -- 4-1. slot_pending_balances 상태를 'approved'로 업데이트
    UPDATE slot_pending_balances
    SET 
        status = 'approved',
        processor_id = p_mat_id,
        notes = format('총판 승인 - 완료율: %s%%', v_work_summary.completion_rate)
    WHERE slot_id = p_slot_id AND status = 'pending';
    
    -- 5. 슬롯 히스토리 로그 추가
    INSERT INTO slot_history_logs (
        slot_id,
        user_id,
        old_status,
        new_status,
        action,
        details,
        created_at
    ) VALUES (
        p_slot_id,
        p_mat_id,
        'approved',
        'pending_user_confirm',
        'mat_complete',
        jsonb_build_object(
            'work_summary', row_to_json(v_work_summary),
            'settlement', row_to_json(v_settlement),
            'notes', p_notes,
            'completed_by', 'mat',
            'mat_completed_time', NOW(),
            'pending_payment', v_settlement.user_payment_amount,
            'pending_refund', v_settlement.refund_amount
        ),
        NOW()
    );
    
    -- 6. 사용자에게 알림 발송 (notifications 테이블)
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        priority,
        status,
        created_at
    ) VALUES (
        v_slot_record.user_id,
        'slot',
        '슬롯 완료 확인 요청',
        format('총판이 슬롯을 완료했습니다. 확인 후 정산이 진행됩니다. (캠페인: %s, 완료율: %s%%)', 
            v_settlement.settlement_details->>'campaign_name',
            v_work_summary.completion_rate
        ),
        format('/slots/%s', p_slot_id),
        'high',  -- 중요: 사용자 확인 필요
        'unread',
        NOW()
    );
    
    -- 7. 결과 반환
    v_result := jsonb_build_object(
        'success', true,
        'slot_id', p_slot_id,
        'status', 'pending_user_confirm',
        'work_summary', row_to_json(v_work_summary),
        'settlement', row_to_json(v_settlement),
        'message', format('슬롯 완료 처리되었습니다. 사용자 확인 대기중입니다. (완료율: %s%%)', 
            v_work_summary.completion_rate
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 롤백
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- 4. 사용자의 거래 완료 확인 함수 (slot_pending_balances 활용하여 캐시 이동)
CREATE OR REPLACE FUNCTION user_confirm_slot_completion(
    p_slot_id UUID,
    p_user_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_slot_record RECORD;
    v_pending_balance RECORD;
    v_settlement RECORD;
    v_work_summary RECORD;
    v_result JSONB;
    v_cash_history_id UUID;
BEGIN
    -- 트랜잭션 시작
    
    -- 1. 슬롯 정보 확인
    SELECT * INTO v_slot_record
    FROM slots
    WHERE id = p_slot_id AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '슬롯을 찾을 수 없거나 권한이 없습니다. slot_id: %, user_id: %', p_slot_id, p_user_id;
    END IF;
    
    -- 상태별 처리
    IF v_slot_record.status = 'completed' THEN
        -- 이미 완료된 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '이미 완료 처리된 슬롯입니다.',
            'status', v_slot_record.status
        );
    ELSIF v_slot_record.status = 'approved' THEN
        -- 총판이 아직 완료 처리하지 않은 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '총판이 아직 작업을 완료하지 않았습니다. 작업 완료 후 다시 시도해주세요.',
            'status', v_slot_record.status
        );
    ELSIF v_slot_record.status != 'pending_user_confirm' THEN
        -- 기타 상태
        RAISE EXCEPTION '사용자 확인 대기 중인 슬롯만 처리할 수 있습니다. 현재 상태: %', v_slot_record.status;
    END IF;
    
    -- 2. slot_pending_balances에서 차감된 금액 확인
    SELECT * INTO v_pending_balance
    FROM slot_pending_balances
    WHERE slot_id = p_slot_id AND user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'pending balance를 찾을 수 없습니다. slot_id: %', p_slot_id;
    END IF;
    
    -- pending balance 상태 확인
    IF v_pending_balance.status = 'pending' THEN
        -- 총판이 아직 승인하지 않은 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '총판이 아직 작업을 승인하지 않았습니다.',
            'pending_status', v_pending_balance.status
        );
    ELSIF v_pending_balance.status = 'rejected' THEN
        -- 총판이 거부한 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '총판이 작업을 거부했습니다. 고객센터에 문의해주세요.',
            'pending_status', v_pending_balance.status,
            'notes', v_pending_balance.notes
        );
    ELSIF v_pending_balance.status = 'processed' THEN
        -- 이미 처리된 경우
        RETURN jsonb_build_object(
            'success', false,
            'message', '이미 정산 처리가 완료되었습니다.',
            'pending_status', v_pending_balance.status
        );
    ELSIF v_pending_balance.status != 'approved' THEN
        -- 기타 상태
        RAISE EXCEPTION '승인된 pending balance만 처리할 수 있습니다. 현재 상태: %', v_pending_balance.status;
    END IF;
    
    -- 3. 정산 진행
    -- 작업 내역 요약 정보 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 정산 금액 계산
    SELECT * INTO v_settlement
    FROM calculate_slot_settlement(p_slot_id);
    
    -- 4. 슬롯 상태를 'completed'로 업데이트
    UPDATE slots
    SET 
        status = 'completed',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_slot_id;
    
    -- 5. slot_pending_balances 상태 업데이트
    UPDATE slot_pending_balances
    SET 
        status = 'processed',
        processor_id = p_user_id,
        processed_at = NOW(),
        notes = format('사용자 승인 - 완료율: %s%%, 작업자 지급: %s, 환불: %s', 
            v_work_summary.completion_rate,
            v_settlement.user_payment_amount,
            v_settlement.refund_amount
        )
    WHERE slot_id = p_slot_id;
    
    -- 6. 슬롯 히스토리 로그 추가
    INSERT INTO slot_history_logs (
        slot_id,
        user_id,
        old_status,
        new_status,
        action,
        details,
        created_at
    ) VALUES (
        p_slot_id,
        p_user_id,
        'pending_user_confirm',
        'completed',
        'user_confirm',
        jsonb_build_object(
            'work_summary', row_to_json(v_work_summary),
            'settlement', row_to_json(v_settlement),
            'notes', p_notes,
            'confirmed_by', 'user',
            'pending_amount', v_pending_balance.amount
        ),
        NOW()
    );
    
    -- 7. 총판에게 작업 대금 지급 (user_cash_history)
    -- pending에서 차감된 금액 중 작업 완료분을 총판에게 지급
    IF v_settlement.user_payment_amount > 0 THEN
        INSERT INTO user_cash_history (
            user_id,
            transaction_type,
            amount,
            description,
            transaction_at,
            mat_id
        ) VALUES (
            v_slot_record.mat_id,  -- 총판에게 지급
            'work',  -- 작업 수익
            v_settlement.user_payment_amount::INTEGER,
            format('슬롯 완료 정산 - %s (%s개 완료)', 
                v_settlement.settlement_details->>'campaign_name',
                v_settlement.worked_quantity
            ),
            NOW(),
            v_slot_record.user_id  -- 광고주 ID
        ) RETURNING id INTO v_cash_history_id;
        
        -- 총판 user_balances 업데이트
        INSERT INTO user_balances (user_id, paid_balance, total_balance)
        VALUES (v_slot_record.mat_id, v_settlement.user_payment_amount, v_settlement.user_payment_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            paid_balance = user_balances.paid_balance + v_settlement.user_payment_amount,
            total_balance = user_balances.total_balance + v_settlement.user_payment_amount,
            updated_at = NOW();
    END IF;
    
    -- 8. 사용자에게 미완료분 환불 처리
    -- pending에서 차감된 금액 중 미완료분을 사용자에게 환불
    IF v_settlement.refund_amount > 0 THEN
        INSERT INTO user_cash_history (
            user_id,
            transaction_type,
            amount,
            description,
            transaction_at,
            mat_id
        ) VALUES (
            v_slot_record.user_id,
            'refund',
            v_settlement.refund_amount::INTEGER,
            format('슬롯 미완료 환불 - %s (%s개 미완료)', 
                v_settlement.settlement_details->>'campaign_name',
                v_settlement.total_quantity - v_settlement.worked_quantity
            ),
            NOW(),
            v_slot_record.mat_id
        );
        
        -- user_balances 업데이트
        INSERT INTO user_balances (user_id, paid_balance, total_balance)
        VALUES (v_slot_record.user_id, v_settlement.refund_amount, v_settlement.refund_amount)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            paid_balance = user_balances.paid_balance + v_settlement.refund_amount,
            total_balance = user_balances.total_balance + v_settlement.refund_amount,
            updated_at = NOW();
    END IF;
    
    -- 9. 감사 로그 기록
    INSERT INTO balance_audit_log (
        user_id,
        change_type,
        old_paid_balance,
        new_paid_balance,
        old_free_balance,
        new_free_balance,
        change_amount,
        details
    )
    SELECT 
        v_slot_record.user_id,
        'slot_completion_confirmed',
        COALESCE(ub.paid_balance, 0) - COALESCE(v_settlement.refund_amount, 0),
        COALESCE(ub.paid_balance, 0),
        COALESCE(ub.free_balance, 0),
        COALESCE(ub.free_balance, 0),
        COALESCE(v_settlement.refund_amount, 0),
        jsonb_build_object(
            'slot_id', p_slot_id,
            'mat_payment', v_settlement.user_payment_amount,
            'user_refund', v_settlement.refund_amount,
            'work_summary', row_to_json(v_work_summary),
            'pending_amount', v_pending_balance.amount,
            'confirmed_by_user', true
        )
    FROM user_balances ub
    WHERE ub.user_id = v_slot_record.user_id;
    
    -- 10. 총판에게 완료 알림
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        priority,
        status,
        created_at
    ) VALUES (
        v_slot_record.mat_id,
        'transaction',  -- 거래 완료
        '슬롯 완료 확정',
        format('사용자가 슬롯 완료를 확인했습니다. (캠페인: %s, 정산금: %s원)', 
            v_settlement.settlement_details->>'campaign_name',
            v_settlement.user_payment_amount
        ),
        format('/slots/%s', p_slot_id),
        'medium',  -- 보통: 정상 프로세스
        'unread',
        NOW()
    );
    
    -- 11. 결과 반환
    v_result := jsonb_build_object(
        'success', true,
        'slot_id', p_slot_id,
        'status', 'completed',
        'work_summary', row_to_json(v_work_summary),
        'settlement', row_to_json(v_settlement),
        'pending_amount', v_pending_balance.amount,
        'message', format('슬롯이 성공적으로 완료되었습니다. 정산이 완료되었습니다. (완료율: %s%%)', 
            v_work_summary.completion_rate
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 롤백
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- 5. 사용자 확인 대기 중인 슬롯 조회 함수
CREATE OR REPLACE FUNCTION get_pending_user_confirm_slots(p_user_id UUID)
RETURNS TABLE (
    slot_id UUID,
    campaign_name TEXT,
    mat_name TEXT,
    mat_completed_at TIMESTAMP,
    work_summary JSONB,
    settlement_info JSONB,
    pending_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as slot_id,
        c.campaign_name,
        u.full_name as mat_name,
        -- mat_completed_at은 히스토리 로그에서 가져옴
        (SELECT shl.created_at 
         FROM slot_history_logs shl 
         WHERE shl.slot_id = s.id 
         AND shl.action = 'mat_complete' 
         ORDER BY shl.created_at DESC 
         LIMIT 1) as mat_completed_at,
        row_to_json(ws.*) as work_summary,
        row_to_json(st.*) as settlement_info,
        spb.amount as pending_amount
    FROM slots s
    JOIN campaigns c ON s.product_id = c.id
    JOIN users u ON s.mat_id = u.id
    LEFT JOIN slot_pending_balances spb ON s.id = spb.slot_id
    CROSS JOIN LATERAL calculate_slot_work_summary(s.id) ws
    CROSS JOIN LATERAL calculate_slot_settlement(s.id) st
    WHERE s.user_id = p_user_id
    AND s.status = 'pending_user_confirm'
    ORDER BY (SELECT shl.created_at 
              FROM slot_history_logs shl 
              WHERE shl.slot_id = s.id 
              AND shl.action = 'mat_complete' 
              ORDER BY shl.created_at DESC 
              LIMIT 1) DESC;
END;
$$ LANGUAGE plpgsql;

-- ===== 테스트 쿼리 예시 =====

-- 1. 총판이 슬롯 완료 처리 (캐시 이동 없음)
-- SELECT mat_complete_slot('슬롯ID', '총판ID', '작업 완료했습니다');

-- 2. 사용자가 거래 완료 확인 (캐시 이동 발생)
-- SELECT user_confirm_slot_completion('슬롯ID', '사용자ID', '확인했습니다');

-- 4. 사용자의 확인 대기 중인 슬롯 조회
-- SELECT * FROM get_pending_user_confirm_slots('사용자ID');

-- ===== 필요한 컬럼 추가 =====
-- 현재 테이블 구조에 필요한 모든 컬럼이 이미 존재함

-- 6. 슬롯 상태 확인 함수 (사용자가 현재 상태를 쉽게 확인)
CREATE OR REPLACE FUNCTION check_slot_status(p_slot_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_slot RECORD;
    v_pending RECORD;
    v_work_summary RECORD;
BEGIN
    -- 슬롯 정보 조회
    SELECT 
        s.*,
        c.campaign_name,
        u.full_name as mat_name
    INTO v_slot
    FROM slots s
    JOIN campaigns c ON s.product_id = c.id
    JOIN users u ON s.mat_id = u.id
    WHERE s.id = p_slot_id AND s.user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '슬롯을 찾을 수 없습니다.'
        );
    END IF;
    
    -- pending balance 조회
    SELECT * INTO v_pending
    FROM slot_pending_balances
    WHERE slot_id = p_slot_id;
    
    -- 작업 요약 조회
    SELECT * INTO v_work_summary
    FROM calculate_slot_work_summary(p_slot_id);
    
    -- 상태별 메시지 생성
    RETURN jsonb_build_object(
        'success', true,
        'slot_status', v_slot.status,
        'pending_status', v_pending.status,
        'campaign_name', v_slot.campaign_name,
        'mat_name', v_slot.mat_name,
        'work_summary', row_to_json(v_work_summary),
        'can_confirm', (v_slot.status = 'pending_user_confirm' AND v_pending.status = 'approved'),
        'message', CASE 
            WHEN v_slot.status = 'approved' AND v_pending.status = 'pending' THEN
                '총판이 작업 중입니다.'
            WHEN v_slot.status = 'pending_user_confirm' AND v_pending.status = 'approved' THEN
                '총판이 작업을 완료했습니다. 확인 후 완료 처리해주세요.'
            WHEN v_slot.status = 'completed' THEN
                '정산이 완료되었습니다.'
            WHEN v_pending.status = 'rejected' THEN
                '총판이 작업을 거부했습니다.'
            ELSE
                '상태를 확인 중입니다.'
        END
    );
END;
$$ LANGUAGE plpgsql;

-- ===== 함수 삭제 쿼리 (필요시 사용) =====
/*
DROP FUNCTION IF EXISTS calculate_slot_work_summary(UUID);
DROP FUNCTION IF EXISTS calculate_slot_settlement(UUID);
DROP FUNCTION IF EXISTS mat_complete_slot(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS user_confirm_slot_completion(UUID, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS get_pending_user_confirm_slots(UUID);
*/

-- =====================================================
-- ===== 테스트 프로세스 상세 가이드 =====
-- =====================================================

-- 테스트 환경 준비
-- -----------------
-- 1. 테스트용 더미 데이터 생성
-- 2. 실제 시나리오 기반 테스트
-- 3. 엣지 케이스 검증
-- 4. 롤백 및 오류 처리 테스트

-- ===== STEP 1: 테스트 데이터 준비 =====

-- 1-1. 테스트용 사용자 생성 (이미 있다면 스킵)
/*
-- 일반 사용자 (광고주)
INSERT INTO users (id, full_name, email, phone, role) 
VALUES ('11111111-1111-1111-1111-111111111111', '테스트광고주', 'advertiser@test.com', '010-1111-1111', 'user');

-- 총판 사용자
INSERT INTO users (id, full_name, email, phone, role) 
VALUES ('22222222-2222-2222-2222-222222222222', '테스트총판', 'mat@test.com', '010-2222-2222', 'mat');

-- 사용자 잔액 초기화
INSERT INTO user_balances (user_id, paid_balance, free_balance, total_balance)
VALUES ('11111111-1111-1111-1111-111111111111', 1000000, 0, 1000000);
*/

-- 1-2. 테스트용 캠페인 생성
/*
INSERT INTO campaigns (id, campaign_name, unit_price, service_type, status)
VALUES (999, '테스트 캠페인', 5000, 'blog', 'active');
*/

-- 1-3. 테스트용 슬롯 생성
/*
INSERT INTO slots (
    id, user_id, mat_id, product_id, quantity, 
    start_date, end_date, status, created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',  -- 광고주
    '22222222-2222-2222-2222-222222222222',  -- 총판
    999,  -- 캠페인 ID
    10,   -- 수량
    '2025-01-20',
    '2025-01-29',
    'approved',
    NOW()
);

-- 슬롯 pending balance 생성 (광고주 캐시 차감)
INSERT INTO slot_pending_balances (
    slot_id, user_id, product_id, amount, status, created_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    999,  -- 캠페인 ID
    50000,  -- 5000원 x 10개
    'pending',  -- 초기 상태
    NOW()
);
*/

-- 1-4. 테스트용 작업 내역 추가
/*
-- 8개 완료 (80% 완료율)
INSERT INTO slot_works_info (slot_id, date, work_cnt, notes) VALUES
('33333333-3333-3333-3333-333333333333', '2025-01-20', 2, '첫날 작업'),
('33333333-3333-3333-3333-333333333333', '2025-01-21', 2, '둘째날 작업'),
('33333333-3333-3333-3333-333333333333', '2025-01-22', 2, '셋째날 작업'),
('33333333-3333-3333-3333-333333333333', '2025-01-23', 2, '넷째날 작업');
*/

-- ===== STEP 2: 기능별 테스트 =====

-- 2-1. 작업 요약 정보 조회 테스트
-- 예상 결과: total_requested_days=10, total_worked_days=4, total_worked_quantity=8, completion_rate=80
SELECT * FROM calculate_slot_work_summary('33333333-3333-3333-3333-333333333333');

-- 2-2. 정산 금액 계산 테스트
-- 예상 결과: worked_quantity=8, user_payment_amount=40000, refund_amount=10000
SELECT * FROM calculate_slot_settlement('33333333-3333-3333-3333-333333333333');

-- ===== STEP 3: 완료 프로세스 테스트 =====

-- 3-1. 총판의 슬롯 완료 처리 테스트
BEGIN;
    -- 실행 전 상태 확인
    SELECT id, status, processed_at FROM slots WHERE id = '33333333-3333-3333-3333-333333333333';
    
    -- 총판이 완료 처리
    SELECT * FROM mat_complete_slot(
        '33333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222222',
        '작업 완료했습니다'
    );
    
    -- 실행 후 상태 확인
    SELECT id, status, processed_at FROM slots WHERE id = '33333333-3333-3333-3333-333333333333';
    -- 예상: status = 'pending_user_confirm'
    
    -- 총판 완료 시간 확인 (히스토리 로그에서)
    SELECT details->>'mat_completed_time' as mat_completed_time 
    FROM slot_history_logs 
    WHERE slot_id = '33333333-3333-3333-3333-333333333333' 
    AND action = 'mat_complete' 
    ORDER BY created_at DESC LIMIT 1;
    
    -- 히스토리 로그 확인
    SELECT * FROM slot_history_logs WHERE slot_id = '33333333-3333-3333-3333-333333333333' ORDER BY created_at DESC LIMIT 1;
    
    -- 알림 생성 확인
    SELECT * FROM notifications WHERE user_id = '11111111-1111-1111-1111-111111111111' ORDER BY created_at DESC LIMIT 1;
    
    -- 롤백 (실제 테스트 시에는 COMMIT)
    ROLLBACK;
END;

-- 3-2. 사용자의 거래 완료 확인 테스트
BEGIN;
    -- 먼저 총판이 완료 처리 (위 단계를 실제로 수행)
    SELECT * FROM mat_complete_slot('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '작업 완료');
    
    -- 실행 전 잔액 확인
    SELECT * FROM user_balances WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    
    -- 사용자가 확인
    SELECT * FROM user_confirm_slot_completion(
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        '확인했습니다'
    );
    
    -- 실행 후 상태 확인
    SELECT id, status, processed_at FROM slots WHERE id = '33333333-3333-3333-3333-333333333333';
    -- 예상: status = 'completed'
    
    -- pending balance 상태 확인
    SELECT * FROM slot_pending_balances WHERE slot_id = '33333333-3333-3333-3333-333333333333';
    -- 예상: status = 'processed'
    
    -- 캐시 이동 확인
    SELECT * FROM user_cash_history WHERE transaction_at > NOW() - INTERVAL '1 minute' ORDER BY transaction_at DESC;
    -- 예상: 총판에게 40000원 지급, 광고주에게 10000원 환불
    
    -- 잔액 업데이트 확인
    SELECT * FROM user_balances WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    
    -- 감사 로그 확인
    SELECT * FROM balance_audit_log WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at DESC;
    
    -- 롤백 (실제 테스트 시에는 COMMIT)
    ROLLBACK;
END;

-- ===== STEP 4: 사용자 확인 대기 슬롯 조회 테스트 =====
-- 총판이 완료 처리한 후 실행
SELECT * FROM get_pending_user_confirm_slots('11111111-1111-1111-1111-111111111111');

-- ===== STEP 5: 예외 상황 테스트 =====

-- 5-1. 권한 없는 총판이 완료 처리 시도
SELECT * FROM mat_complete_slot(
    '33333333-3333-3333-3333-333333333333',
    '99999999-9999-9999-9999-999999999999',  -- 잘못된 총판 ID
    '테스트'
);
-- 예상: 오류 발생 - "슬롯을 찾을 수 없거나 권한이 없습니다"

-- 5-2. 이미 완료된 슬롯을 다시 완료 처리 시도
BEGIN;
    -- 슬롯 상태를 임시로 completed로 변경
    UPDATE slots SET status = 'completed' WHERE id = '33333333-3333-3333-3333-333333333333';
    
    -- 완료 처리 시도
    SELECT * FROM mat_complete_slot('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '테스트');
    -- 예상: 오류 발생 - "승인된 슬롯만 완료 처리할 수 있습니다"
    
    ROLLBACK;
END;

-- 5-3. pending balance가 없는 상태에서 사용자 확인 시도
BEGIN;
    -- 슬롯을 pending_user_confirm 상태로 변경
    UPDATE slots SET status = 'pending_user_confirm' WHERE id = '33333333-3333-3333-3333-333333333333';
    
    -- pending balance 삭제
    DELETE FROM slot_pending_balances WHERE slot_id = '33333333-3333-3333-3333-333333333333';
    
    -- 사용자 확인 시도
    SELECT * FROM user_confirm_slot_completion('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');
    -- 예상: 오류 발생 - "pending balance를 찾을 수 없습니다"
    
    ROLLBACK;
END;

-- ===== STEP 6: 성능 테스트 =====

-- 6-1. 대량 작업 내역이 있는 경우 성능 확인
EXPLAIN ANALYZE
SELECT * FROM calculate_slot_work_summary('33333333-3333-3333-3333-333333333333');

-- 6-2. 여러 슬롯 조회 성능
EXPLAIN ANALYZE
SELECT * FROM get_pending_user_confirm_slots('11111111-1111-1111-1111-111111111111');

-- ===== STEP 7: 데이터 정합성 검증 =====

-- 7-1. 전체 프로세스 실행 후 잔액 검증
WITH balance_check AS (
    SELECT 
        user_id,
        SUM(CASE WHEN transaction_type IN ('work', 'refund') THEN amount ELSE 0 END) as slot_changes,
        COUNT(*) as transaction_count
    FROM user_cash_history
    WHERE transaction_at > NOW() - INTERVAL '1 hour'
    AND transaction_type IN ('work', 'refund')
    GROUP BY user_id
)
SELECT 
    bc.*,
    ub.total_balance as current_balance
FROM balance_check bc
JOIN user_balances ub ON bc.user_id = ub.user_id;

-- 7-2. pending balance와 실제 정산 금액 일치 여부 확인
WITH settlement_check AS (
    SELECT 
        s.id as slot_id,
        spb.amount as pending_amount,
        cs.base_amount as calculated_amount,
        spb.amount = cs.base_amount as amount_match
    FROM slots s
    JOIN slot_pending_balances spb ON s.id = spb.slot_id
    CROSS JOIN LATERAL calculate_slot_settlement(s.id) cs
    WHERE s.status IN ('approved', 'pending_user_confirm', 'completed')
)
SELECT * FROM settlement_check WHERE NOT amount_match;

-- ===== 테스트 데이터 정리 =====
/*
-- 테스트 완료 후 데이터 삭제
DELETE FROM slot_history_logs WHERE slot_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM balance_audit_log WHERE details->>'slot_id' = '33333333-3333-3333-3333-333333333333';
DELETE FROM notifications WHERE link = '/slots/33333333-3333-3333-3333-333333333333';
DELETE FROM user_cash_history WHERE description LIKE '%테스트 캠페인%';
DELETE FROM slot_works_info WHERE slot_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM slot_pending_balances WHERE slot_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM slots WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM campaigns WHERE id = 999;
DELETE FROM user_balances WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
*/

-- ===== 체크리스트 =====
/*
테스트 완료 체크리스트:
□ 작업 요약 계산 정확성
□ 정산 금액 계산 정확성
□ 총판 완료 처리 정상 동작
□ 사용자 확인 프로세스 정상 동작
□ 캐시 이동 정확성
□ 알림 생성 확인
□ 히스토리 로그 기록
□ 감사 로그 기록
□ 권한 검증
□ 상태 전이 검증
□ 트랜잭션 롤백 테스트
□ 동시성 이슈 테스트
□ 성능 테스트
*/