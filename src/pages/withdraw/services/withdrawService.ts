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
  rejected_reason?: string; // 반려 사유 추가
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
      .select('id, amount, status, requested_at, bank_name, account_number, account_holder, fee_amount, rejected_reason')
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
  
  
  try {
    // 기본 설정값 (오류 발생 시 사용)
    const defaultSettings: WithdrawSetting = {
      min_request_amount: 10000,
      min_request_percentage: 3,
      fee_percentage: 3
    };
    
    // 사용자 ID가 제공되면 사용자별 설정을 먼저 확인
    if (userId) {
      
      // 1. 사용자별 설정 확인을 건너뛰고 바로 전역 설정을 사용
      // withdraw_user_settings 테이블에 user_id 컬럼이 없음
      
      // 사용자별 설정 건너뛰기 - 오류가 아닌 일반 로그로 남김
      const userSetting = null;
      const userSettingError = null; // 오류 없음
      
      
      
      // 사용자별 설정은 사용하지 않습니다
      // userSetting이 null이므로 이 블록은 항상 건너뜁니다
    }
    
    
    // 2. 사용자별 설정이 없거나 오류 발생 시 전역 설정 확인
    try {
      const { data: globalSetting, error: globalSettingError } = await supabase
        .from('withdraw_global_settings')
        .select('*')
        .single();
      
      if (globalSettingError) {
        return defaultSettings;
      }
      
      if (!globalSetting) {
        return defaultSettings;
      }
      
      // 필드명 매핑 (실제 DB 필드 -> 코드에서 사용하는 필드)
      const mappedSetting: WithdrawSetting = {
        min_request_amount: globalSetting.min_request_amount || 10000,
        min_request_percentage: globalSetting.min_request_percentage || 0,
        // 이전 코드와의 호환성을 위한 필드 추가
        fee_percentage: globalSetting.min_request_percentage || 0
      };
      
      return mappedSetting;
    } catch (err) {
        return defaultSettings;
    }
    
  } catch (err) {
    
    // 오류 발생 시 기본 설정값 반환
    const defaultSettings = {
      min_request_amount: 10000,
      min_request_percentage: 3,
      fee_percentage: 3
    };
    
    return defaultSettings;
  }
};

/**
 * 사용자의 캐시 잔액을 조회합니다.
 * @param userId 사용자 ID
 * @param userRole 사용자 역할 (선택적)
 * @returns 캐시 잔액
 */
export const getUserCashBalance = async (userId: string, userRole?: string): Promise<number> => {
  // 초보자(beginner) 역할의 경우 항상 0 반환
  if (userRole === 'beginner') {
    return 0;
  }
  
  try {
    
    // 여러 필드명 시도를 위한 쿼리 구성
    let query = supabase.from('user_balances').select('*');
    
    // user_id로 먼저 시도
    try {
      query = query.eq('user_id', userId);
    } catch (err1) {
      // userid로 시도
      try {
        query = query.eq('userid', userId);
      } catch (err2) {
        // 계속 진행
      }
    }
    
    // 쿼리 실행
    const { data, error } = await query.maybeSingle();
    
    if (error || !data) {
      return 0;
    }
    return data?.paid_balance || 0;
  } catch (err) {
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
    
    // 초기 조회 시도
    let query = supabase
      .from('withdraw_requests')
      .select('bank_name, account_number, account_holder, requested_at');
    
    try {
      // 사용자 ID로 필터링 시도
      query = query.eq('user_id', userId);
    } catch (filterErr) {
      // 컬럼 이름 다를 경우 대비하여 다른 필드명으로 시도
      try {
        query = query.eq('userid', userId);
      } catch (err2) {
        // 계속 진행
      }
    }
    
    // 완성된 쿼리 실행
    const result = await query
      .order('requested_at', { ascending: false })
      .limit(1);
    
    const { data, error } = result;
    
    // 오류 처리
    if (error) {
      return null;
    }
    
    // 결과가 없거나 배열이 비어있는 경우
    if (!data || data.length === 0) {
      return null;
    }
    return data[0] as LastWithdrawAccount;
  } catch (err) {
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
 * @param userRole 사용자 역할 (선택적)
 * @returns 성공 여부와 결과 메시지를 담은 객체
 */
export const createWithdrawRequest = async (
  userId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountHolder: string,
  feeAmount: number,
  userRole?: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // 초보자(beginner) 역할은 출금 불가
    if (userRole === 'beginner') {
      throw new Error('초보자 계정은 출금 기능을 사용할 수 없습니다. 계정 업그레이드 후 이용해주세요.');
    }

    // 1. user_balances 테이블에서 현재 잔액 확인
    const { data: balance, error: balanceError } = await supabase
      .from('user_balances')
      .select('paid_balance, total_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      throw new Error('잔액 조회 중 오류가 발생했습니다.');
    }

    if (!balance || balance.paid_balance < amount) {
      throw new Error('출금 금액이 보유 캐시보다 큽니다. 새로고침 후 다시 시도해주세요.');
    }

    // 2. withdraw_requests 테이블에 출금 요청 데이터 삽입
    
    // 기본 필드와 대체 필드 모두 포함하여 삽입 시도
    const insertData = {
      user_id: userId,
      userid: userId, // 대체 필드명 추가
      amount: amount,
      status: 'pending',
      bank_name: bankName,
      account_number: accountNumber,
      account_holder: accountHolder,
      fee_amount: feeAmount
    };
    
    // 삽입 요청
    const { data: requestData, error: requestError } = await supabase
      .from('withdraw_requests')
      .insert(insertData)
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
        amount: amount * -1, // 출금은 음수로 기록
        description: `${bankName} ${accountNumber} 계좌로 출금`,
        reference_id: requestData[0].id
      });
    
    if (historyError) {
      throw historyError;
    }
    
    // 4. user_balances 테이블에서 paid_balance와 total_balance 모두 차감
    const { error: updateBalanceError } = await supabase
      .from('user_balances')
      .update({
        paid_balance: balance.paid_balance - amount,
        total_balance: balance.total_balance - amount,
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
    
    return {
      success: false,
      message: err.message || '출금 요청 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};