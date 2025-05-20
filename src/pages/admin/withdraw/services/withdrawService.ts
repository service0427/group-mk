import { supabase } from "@/supabase";
import { min } from "date-fns";
import { id } from "date-fns/locale";
import { createWithdrawApprovedNotification, createWithdrawRejectedNotification } from "@/utils/notificationActions";


// 출금 전역 설정 정보 가져오는 함수
export async function getWithdrawGlobalSettings() {
    const { data, error } = await supabase.
        from("withdraw_global_settings")
        .select("*")
        .single();

    if (error) {
        
        throw new Error("Failed to fetch global settings");
    }
    return data;
}

// 출금 전역 설정 정보 업데이트하는 함수
export async function updateWithdrawGlobalSettings(settings: {
  id: string;
  min_request_amount?: number;
  min_request_percentage?: number;
  fee_percentage?: number;
  [key: string]: any;
}) {
    const { data, error } = await supabase
        .from("withdraw_global_settings")
        .update(settings)
        .eq("id", settings.id);

    if (error) {
        
        throw new Error("Failed to update global settings");
    }
    return data;
}

// 총판 아이디 리스트만 가져오는 함수
export async function getDistributor() {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('role', 'distributor');

    if (error) {
        
        throw new Error("Failed to fetch distributor IDs");
    }
    return data;
}

// 사용자별 출금 설정 정보 저장하는 함수
export async function saveUserWithdrawSettings(settings: {
  user_id: string;
  min_request_amount?: number;
  min_request_percentage?: number;
}) {
    const { data, error } = await supabase
        .from("withdraw_user_settings")
        .upsert({
             mat_id: settings.user_id,
             min_request_amount: settings.min_request_amount,
             min_request_percentage: settings.min_request_percentage,
             updated_at: new Date()
            });

    if (error) {
        
        throw new Error("Failed to save user settings");
    }
    return data;
}   

// 개별 설정된 사용자 리스트 가져오는 함수
export async function getUserWithdrawSettings() {
    // users 테이블과 join해서 사용자 정보와 함께 가져오기
    const { data, error } = await supabase
        .from("withdraw_user_settings")
        .select(`
            id,
            mat_id,
            min_request_amount,
            min_request_percentage,
            created_at,
            updated_at,
            users:mat_id (
                id,
                email,
                full_name
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        
        throw new Error("Failed to fetch user withdraw settings");
    }
    return data;
}

// 개별 설정 삭제 함수
export async function deleteUserWithdrawSetting(id: string) {
    const { data, error } = await supabase
        .from("withdraw_user_settings")
        .delete()
        .eq("id", id);

    if (error) {
        
        throw new Error("Failed to delete user withdraw setting");
    }
    return data;
}

// 출금 승인 리스트 가져오는 함수 수정
export async function getWithdrawApproveList() {
    // 오류 메시지에서 제안한 관계 이름 중 하나를 사용
    const { data, error } = await supabase
        .from("withdraw_requests")
        .select(`*,
            users!withdraw_requests_user_id_fkey (
                id,
                email,
                full_name
            )
        `);
        
    if (error) {
        
        throw new Error("Failed to fetch withdraw approve list");
    }
    return data;
}

// 출금 요청 승인 함수
export async function approveWithdrawRequest(id: string, adminUserId: string) {
    try {
        // 1. 출금 요청 정보 확인
        const { data: requestData, error: requestError } = await supabase
            .from("withdraw_requests")
            .select("id, user_id, amount, status, fee_amount")
            .eq("id", id)
            .single();
            
        if (requestError) {
            
            throw new Error("출금 요청 정보를 가져오는데 실패했습니다.");
        }
        
        // 이미 처리된 요청인지 확인
        if (requestData.status !== 'pending') {
            
            throw new Error(`이미 ${requestData.status === 'approved' ? '승인' : '반려'}된 요청입니다.`);
        }
        
        const now = new Date();
        
        // 2. 출금 요청 상태 업데이트
        const { error: updateError } = await supabase
            .from("withdraw_requests")
            .update({
                status: 'approved',
                processed_at: now,
                processed_by: adminUserId,
                updated_at: now
            })
            .eq("id", id)
            .eq("status", "pending"); // 상태가 pending인 경우에만 업데이트
            
        if (updateError) {
            
            throw new Error("출금 요청 승인 중 오류가 발생했습니다.");
        }
        
        // 3. 관리자 로그 기록 (추가 정보 기록)
        try {
            await supabase
                .from("admin_action_logs")
                .insert({
                    admin_id: adminUserId,
                    action_type: 'withdraw_approval',
                    target_id: id,
                    details: {
                        withdraw_amount: requestData.amount,
                        fee_amount: requestData.fee_amount,
                        net_amount: requestData.amount - (requestData.fee_amount || 0),
                        user_id: requestData.user_id
                    },
                    created_at: now
                });
        } catch (logError) {
            
        }
        
        // 4. 사용자에게 승인 알림 전송
        try {
            const result = await createWithdrawApprovedNotification(
                requestData.user_id,
                requestData.amount,
                requestData.fee_amount || 0
            );
            console.log('출금 승인 알림 전송 성공:', result);
        } catch (notificationError) {
            // 알림 전송 실패는 출금 승인 성공에 영향을 주지 않음
            console.error('출금 승인 알림 전송 실패:', notificationError);
        }
        
        return {
            success: true,
            message: "출금 요청이 성공적으로 승인되었습니다.",
            data: requestData
        };
    } catch (error: any) {
        
        return {
            success: false,
            message: error.message || "출금 요청 승인 중 오류가 발생했습니다."
        };
    }
}


// 출금 요청 반려 함수
export async function rejectWithdrawRequest(id: string, rejected_reason: string) {
    try {
        // 1. 먼저 출금 요청 정보 가져오기 (상태 확인 포함)
        const { data: requestData, error: requestError } = await supabase
            .from("withdraw_requests")
            .select("id, user_id, amount, status, fee_amount")
            .eq("id", id)
            .single();
            
        if (requestError) {
            
            throw new Error("출금 요청 정보를 가져오는데 실패했습니다.");
        }
        
        // 이미 처리된 요청인지 확인
        if (requestData.status !== 'pending') {
            
            throw new Error(`이미 ${requestData.status === 'approved' ? '승인' : '반려'}된 요청입니다.`);
        }
        
        // 2. 금액 유효성 검사
        const userId = requestData.user_id;
        const amount = Number(requestData.amount);
        
        if (isNaN(amount) || amount <= 0) {
            
            throw new Error("금액 정보가 올바르지 않습니다.");
        }
        
        const now = new Date();
        
        // 3.1 출금 요청 상태 업데이트
        const { error: updateError } = await supabase
            .from("withdraw_requests")
            .update({
                status: 'rejected',
                rejected_reason: rejected_reason,
                rejected_at: now,
                updated_at: now
            })
            .eq("id", id)
            .eq("status", "pending"); // 추가 안전장치: 상태가 pending인 경우에만 업데이트
            
        if (updateError) {
            
            throw new Error("출금 요청 상태 업데이트 중 오류가 발생했습니다.");
        }
        
        // 3.2 현재 사용자 잔액 조회 후 업데이트
        // 현재 잔액 조회
        const { data: balanceData, error: balanceError } = await supabase
            .from("user_balances")
            .select("paid_balance, free_balance, total_balance")
            .eq("user_id", userId)
            .single();
            
        if (balanceError) {
            
            throw new Error("사용자 잔액 조회 중 오류가 발생했습니다.");
        }
        
        // 안전하게 금액 계산 (null이나 undefined 처리)
        const currentPaidBalance = typeof balanceData.paid_balance === 'number' ? balanceData.paid_balance : 0;
        const currentFreeBalance = typeof balanceData.free_balance === 'number' ? balanceData.free_balance : 0;
        const updatedPaidBalance = currentPaidBalance + amount;
        
        // 잔액 업데이트 (paid_balance로 환원, 출금은 항상 paid_balance에서만 처리되므로)
        const { error: updateBalanceError } = await supabase
            .from("user_balances")
            .update({
                paid_balance: updatedPaidBalance,
                total_balance: updatedPaidBalance + currentFreeBalance,
                updated_at: now
            })
            .eq("user_id", userId);
            
        if (updateBalanceError) {
            
            throw new Error("사용자 잔액 업데이트 중 오류가 발생했습니다.");
        }
        
        // 3.3 거래 내역 추가 - withdrawal 타입 사용 (테이블 변경 후)
        try {
            const { error: historyError } = await supabase
                .from("user_cash_history")
                .insert({
                    user_id: userId,
                    transaction_type: 'withdrawal', // 출금 관련 처리이므로 withdrawal 사용
                    amount: amount, // 양수로 저장 (반려로 인한 금액 복구)
                    description: `출금 반려 (사유: ${rejected_reason})`,
                    transaction_at: now,
                    reference_id: id,
                    balance_type: null // balance_type을 null로 설정 (제약 조건에 맞게)
                });
                
            if (historyError) {
                
            }
        } catch (e) {
            
        }
        
        // 3.4 감사 로그 추가 (balance_audit_log)
        try {
            await supabase
                .from("balance_audit_log")
                .insert({
                    user_id: userId,
                    change_type: 'increase',
                    old_paid_balance: currentPaidBalance,
                    new_paid_balance: updatedPaidBalance,
                    old_free_balance: currentFreeBalance,
                    new_free_balance: currentFreeBalance,
                    change_amount: amount,
                    details: {
                        operation: 'withdraw_reject',
                        withdraw_request_id: id,
                        rejected_reason: rejected_reason
                    },
                    created_at: now
                });
        } catch (auditLogError) {
            
        }
        
        // 3.5 사용자에게 반려 알림 전송
        try {
            const result = await createWithdrawRejectedNotification(
                userId,
                amount,
                rejected_reason
            );
            console.log('출금 반려 알림 전송 성공:', result);
        } catch (notificationError) {
            // 알림 전송 실패는 출금 반려 성공에 영향을 주지 않음
            console.error('출금 반려 알림 전송 실패:', notificationError);
        }
        
        return {
            success: true,
            message: "출금 요청이 성공적으로 반려되었습니다."
        };
    } catch (error: any) {
        
        return {
            success: false,
            message: error.message || "출금 요청 반려 중 오류가 발생했습니다."
        };
    }
}