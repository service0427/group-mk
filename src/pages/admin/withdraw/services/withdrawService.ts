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
            users:mat_id (
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