import { supabase } from "@/supabase";
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