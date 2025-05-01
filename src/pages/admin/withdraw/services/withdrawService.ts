import { supabase } from "@/supabase";
import { min } from "date-fns";
import { id } from "date-fns/locale";


// 출금 전역 설정 정보 가져오는 함수
export async function getWithdrawGlobalSettings() {
    const { data, error } = await supabase.
        from("withdraw_global_settings")
        .select("*")
        .single();

    if (error) {
        console.error("Error fetching global settings:", error);
        throw new Error("Failed to fetch global settings");
    }
    return data;
}

// 출금 전역 설정 정보 업데이트하는 함수
export async function updateWithdrawGlobalSettings(settings) {
    const { data, error } = await supabase
        .from("withdraw_global_settings")
        .update(settings)
        .eq("id", settings.id);

    if (error) {
        console.error("Error updating global settings:", error);
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
        console.error("Error fetching distributor IDs:", error);
        throw new Error("Failed to fetch distributor IDs");
    }
    return data;
}

// 사용자별 출금 설정 정보 저장하는 함수
export async function saveUserWithdrawSettings(settings) {
    const { data, error } = await supabase
        .from("withdraw_user_settings")
        .upsert({
             mat_id: settings.user_id,
             min_request_amount: settings.min_request_amount,
             min_request_percentage: settings.min_request_percentage,
             updated_at: new Date()
            });

    if (error) {
        console.error("Error saving user settings:", error);
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
        console.error("Error fetching user withdraw settings:", error);
        throw new Error("Failed to fetch user withdraw settings");
    }
    return data;
}

// 개별 설정 삭제 함수
export async function deleteUserWithdrawSetting(id) {
    const { data, error } = await supabase
        .from("withdraw_user_settings")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting user withdraw setting:", error);
        throw new Error("Failed to delete user withdraw setting");
    }
    return data;
}

// 출금 승인 리스트 가져오는 함수
export async function getWithdrawApproveList() {
    const { data, error } = await supabase
        .from("withdraw_requests")
        .select(`*,
            users:user_id (

                id,
                email,
                full_name
            )
        `);
        
    if (error) {
        console.error("Error fetching withdraw approve list:", error);
        throw new Error("Failed to fetch withdraw approve list");
    }
    return data;
}

// 출금 요청 승인 함수
export async function approveWithdrawRequest(id) {
    const { data, error } = await supabase
        .from("withdraw_requests")
        .update({
            status: 'approved',
            updated_at: new Date()
        })
        .eq("id", id);
        
    if (error) {
        console.error("Error approving withdraw request:", error);
        throw new Error("Failed to approve withdraw request");
    }
    return data;
}

// 출금 요청 반려 함수
export async function rejectWithdrawRequest(id, rejected_reason) {
    try {
        // 1. 먼저 출금 요청 정보 가져오기 (상태 확인 포함)
        const { data: requestData, error: requestError } = await supabase
            .from("withdraw_requests")
            .select("id, user_id, amount, status")
            .eq("id", id)
            .single();
            
        if (requestError) {
            console.error("Error fetching withdraw request:", requestError);
            throw new Error("Failed to fetch withdraw request details");
        }
        
        // 이미 처리된 요청인지 확인
        if (requestData.status !== 'pending') {
            console.warn(`Withdraw request ${id} is already ${requestData.status}`);
            throw new Error(`이미 ${requestData.status === 'approved' ? '승인' : '반려'}된 요청입니다.`);
        }
        
        // 2. 금액 유효성 검사
        const userId = requestData.user_id;
        let amount = Number(requestData.amount);
        
        if (isNaN(amount) || amount <= 0) {
            console.error(`Invalid amount for withdraw request ${id}: ${requestData.amount}`);
            throw new Error("금액 정보가 올바르지 않습니다.");
        }
        
        // 3.1 출금 요청 상태 업데이트
        const { error: updateError } = await supabase
            .from("withdraw_requests")
            .update({
                status: 'rejected',
                rejected_reason: rejected_reason,
                updated_at: new Date()
            })
            .eq("id", id)
            .eq("status", "pending"); // 추가 안전장치: 상태가 pending인 경우에만 업데이트
            
        if (updateError) {
            console.error("Error rejecting withdraw request:", updateError);
            throw new Error("출금 요청 상태 업데이트 중 오류가 발생했습니다.");
        }
        
        // 3.2 현재 사용자 잔액 조회 후 업데이트
        // 현재 잔액 조회
        const { data: balanceData, error: balanceError } = await supabase
            .from("user_balances")
            .select("paid_balance")
            .eq("user_id", userId)
            .single();
            
        if (balanceError) {
            console.error("Error fetching user balance:", balanceError);
            throw new Error("사용자 잔액 조회 중 오류가 발생했습니다.");
        }
        
        // 안전하게 금액 계산 (null이나 undefined 처리)
        const currentBalance = typeof balanceData.paid_balance === 'number' ? balanceData.paid_balance : 0;
        const updatedBalance = currentBalance + amount;
        
        // 잔액 업데이트
        const { error: updateBalanceError } = await supabase
            .from("user_balances")
            .update({
                paid_balance: updatedBalance,
                updated_at: new Date()
            })
            .eq("user_id", userId);
            
        if (updateBalanceError) {
            console.error("Error updating user balance:", updateBalanceError);
            throw new Error("사용자 잔액 업데이트 중 오류가 발생했습니다.");
        }
        
        
        // 3.3 거래 내역 추가 (실패해도 전체 프로세스에 영향 없음)
        try {
            await supabase
                .from("user_cash_history")
                .insert({
                    user_id: userId,
                    transaction_type: 'withdrawal', 
                    cash_amount: amount, // 양수로 저장 (반려로 인한 금액 복구)
                    description: '출금 반려',
                    user_cash_history: new Date()
                });
        } catch (historyError) {
            // 거래 내역 추가는 실패해도 진행
            console.warn("Failed to create transaction history, but withdraw rejected successfully:", historyError);
        }
        
        return {
            success: true,
            message: "출금 요청이 성공적으로 반려되었습니다."
        };
    } catch (error) {
        console.error("Error in reject withdraw process:", error);
        throw error;
    }
}