import { supabase } from '@/supabase';

// 출금 요청 타입 정의
export interface WithdrawRequest {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  fee_amount: number;
}

// 출금 설정 타입 정의
export interface WithdrawSetting {
  min_request_amount: number;
  min_request_percentage: number;
  // 이전 필드명과의 호환성을 위한 매핑
  fee_percentage?: number; // min_request_percentage와 동일
}

/**
 * 사용자의 최근 출금 요청 내역을 조회합니다.
 * @param userId 사용자 ID
 * @param limit 조회할 건수 (기본값: 5)
 * @returns 출금 요청 내역 배열
 */
export const getRecentWithdrawRequests = async (userId: string, limit: number = 5): Promise<WithdrawRequest[]> => {
  try {
    // 타임아웃 설정 (10초)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('요청 시간 초과')), 10000)
    );
    
    const fetchPromise = supabase
      .from('withdraw_requests')
      .select('id, amount, status, requested_at, bank_name, account_number, account_holder, fee_amount')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(limit);
    
    // Promise.race를 사용하여 타임아웃 처리
    const result = await Promise.race([
      fetchPromise,
      timeoutPromise
    ]);
    
    const { data, error } = result;
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('최근 출금 내역 조회 오류:', err);
    // 에러 발생 시 빈 배열 반환
    return [];
  }
};

/**
 * 출금 설정을 조회합니다. 사용자별 설정이 있으면 해당 설정을 우선 사용하고, 없으면 전역 설정을 사용합니다.
 * @param userId 사용자 ID (선택적)
 * @returns 출금 설정 객체
 */
export const getWithdrawSettings = async (userId?: string): Promise<WithdrawSetting> => {
  console.log('getWithdrawSettings 호출됨 - userId:', userId);
  
  try {
    // 기본 설정값 (오류 발생 시 사용)
    const defaultSettings: WithdrawSetting = {
      min_request_amount: 10000,
      min_request_percentage: 3,
      fee_percentage: 3
    };
    
    // 사용자 ID가 제공되면 사용자별 설정을 먼저 확인
    if (userId) {
      console.log('사용자별 설정 확인 시도');
      // 1. 사용자별 설정 확인
      const { data: userSetting, error: userSettingError } = await supabase
        .from('withdraw_user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)  // 활성화된 설정만 가져오기
        .maybeSingle();
      
      console.log('사용자별 설정 결과:', userSetting, '오류:', userSettingError);
      
      // 사용자별 설정이 있고 오류가 없으면 해당 설정 반환
      if (!userSettingError && userSetting) {
        console.log('사용자별 설정 사용:', userSetting);
        
        // 필드명 매핑 (실제 DB 필드 -> 코드에서 사용하는 필드)
        const mappedSetting: WithdrawSetting = {
          min_request_amount: userSetting.min_request_amount || 10000,
          min_request_percentage: userSetting.min_request_percentage || 0,
          // 이전 코드와의 호환성을 위한 필드 추가
          fee_percentage: userSetting.min_request_percentage || 0
        };
        
        console.log('매핑된 사용자 설정:', mappedSetting);
        return mappedSetting;
      }
    }
    
    console.log('전역 설정 확인 시도');
    // 2. 사용자별 설정이 없거나 오류 발생 시 전역 설정 확인
    const { data: globalSetting, error: globalSettingError } = await supabase
      .from('withdraw_global_settings')
      .select('*')
      .single();
    
    console.log('전역 설정 결과:', JSON.stringify(globalSetting), '오류:', globalSettingError);
    
    if (globalSettingError) {
      console.error("출금 전역 설정 로딩 오류:", globalSettingError);
      console.log('기본 설정값 사용:', defaultSettings);
      return defaultSettings;
    }
    
    console.log('전역 설정 사용:', globalSetting);
    
    // 필드명 매핑 (실제 DB 필드 -> 코드에서 사용하는 필드)
    const mappedSetting: WithdrawSetting = {
      min_request_amount: globalSetting.min_request_amount || 10000,
      min_request_percentage: globalSetting.min_request_percentage || 0,
      // 이전 코드와의 호환성을 위한 필드 추가
      fee_percentage: globalSetting.min_request_percentage || 0
    };
    
    console.log('매핑된 설정:', mappedSetting);
    return mappedSetting;
    
  } catch (err) {
    console.error("출금 설정 로딩 오류:", err);
    // 오류 발생 시 기본 설정값 반환
    const defaultSettings = {
      min_request_amount: 10000,
      min_request_percentage: 3,
      fee_percentage: 3
    };
    console.log('오류로 인한 기본 설정값 사용:', defaultSettings);
    return defaultSettings;
  }
};

/**
 * 사용자의 캐시 잔액을 조회합니다.
 * @param userId 사용자 ID
 * @returns 캐시 잔액
 */
export const getUserCashBalance = async (userId: string): Promise<number> => {
  try {
    // 사용자 캐시 잔액 조회 API 호출
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    return data?.paid_balance || 0;
  } catch (err) {
    console.error("캐시 잔액 조회 오류:", err);
    return 0;
  }
};

/**
 * 사용자의 최근 출금 계좌 정보를 조회합니다.
 * @param userId 사용자 ID
 * @returns 마지막 출금 신청 계좌 정보
 */
export interface LastWithdrawAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
  requested_at: string;
}

export const getLastWithdrawAccount = async (userId: string): Promise<LastWithdrawAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('withdraw_requests')
      .select('bank_name, account_number, account_holder, requested_at')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116는 결과가 없을 때 발생하는 오류
        return null;
      }
      throw error;
    }
    
    return data as LastWithdrawAccount;
  } catch (err) {
    console.error("마지막 출금 신청 정보 조회 오류:", err);
    return null;
  }
};

// 별도의 계좌 저장 기능 제거 (withdraw_requests 테이블에 자동 저장됨)

/**
 * 출금 요청을 생성합니다.
 * @param userId 사용자 ID
 * @param amount 출금 금액
 * @param bankName 은행명
 * @param accountNumber 계좌번호
 * @param accountHolder 예금주
 * @param feeAmount 수수료 금액
 * @returns 성공 여부와 결과 메시지를 담은 객체
 */
export const createWithdrawRequest = async (
  userId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountHolder: string,
  feeAmount: number
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {

    // 1. user_balances 테이블에서 현재 잔액 확인
    const { data: balance, error: balanceError } = await supabase
      .from('user_balances')
      .select('paid_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      throw new Error('잔액 조회 중 오류가 발생했습니다.');
    }

    if (!balance || balance.paid_balance < amount) {
      throw new Error('출금 금액이 보유 캐시보다 큽니다. 새로고침 후 다시 시도해주세요.');
    }

    // 2. withdraw_requests 테이블에 출금 요청 데이터 삽입
    const { data: requestData, error: requestError } = await supabase
      .from('withdraw_requests')
      .insert({
        user_id: userId,
        amount: amount,
        status: 'pending',
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
        fee_amount: feeAmount
      })
      .select();
    
    if (requestError) {
      throw requestError;
    }
    
    // 3. user_cash_history 테이블에 출금 내역 추가 (트랜잭션 유형: withdrawal)
    const { error: historyError } = await supabase
      .from('user_cash_history')
      .insert({
        user_id: userId,
        transaction_type: 'withdrawal',
        cash_amount: amount,
        description: `${bankName} ${accountNumber} 계좌로 출금`,
        reference_id: requestData[0].id
      });
    
    if (historyError) {
      throw historyError;
    }
    
    // 4. user_balances 테이블에서 잔액 차감
    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({
        paid_balance: balance.paid_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateBalanceError) {
      throw updateBalanceError;
    }
    
    // 5. 추가 작업이 필요하면 여기에 추가
    
    return {
      success: true,
      message: '출금 신청이 성공적으로 처리되었습니다.',
      data: requestData[0]
    };
  } catch (err: any) {
    console.error('출금 요청 오류:', err);
    return {
      success: false,
      message: err.message || '출금 요청 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};