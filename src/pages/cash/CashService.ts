import { supabase } from '@/supabase';

/**
 * 사용자 캐시 서비스
 * 캐시 충전 요청 생성 및 캐시 내역 관리
 * 직접 테이블 접근 방식으로 구현
 */
export class CashService {
  /**
   * 캐시 충전 요청을 생성합니다.
   * @param userId 사용자 ID
   * @param amount 충전 금액
   * @returns 처리 결과
   */
  public static async createChargeRequest(
    userId: string,
    amount: number
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!amount || amount <= 0) {
        throw new Error('충전할 금액을 입력해주세요.');
      }

      // 현재 캐시 설정 조회 (사용자별 → 전역)
      const { data: userSettingData } = await supabase
        .from('cash_user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      const { data: globalSettingData, error: globalSettingError } = await supabase
        .from('cash_global_settings')
        .select('*')
        .single();

      if (globalSettingError) {
        console.error('전역 설정 조회 실패:', globalSettingError);
      }

      // 사용자별 설정이 있으면 사용, 없으면 전역 설정 사용
      const setting = userSettingData || globalSettingData;
      
      // 최소 충전 금액보다 적으면 무료 캐시 비율을 0으로 설정
      let freeCashPercentage = 0;
      if (setting && amount >= setting.min_request_amount) {
        freeCashPercentage = setting.free_cash_percentage || 0;
      }
      
      console.log(`충전 금액: ${amount}, 최소 요청 금액: ${setting?.min_request_amount}, 무료 캐시 비율: ${freeCashPercentage}`);

      // 충전 요청 생성
      const { data, error } = await supabase
        .from('cash_charge_requests')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'pending',
          free_cash_percentage: freeCashPercentage,
          requested_at: new Date().toISOString()
        })
        .select();

      if (error) {
        throw new Error(`충전 요청 생성 실패: ${error.message}`);
      }

      return {
        success: true,
        message: `${amount.toLocaleString()}원 충전이 요청되었습니다.`,
        data: data?.[0]
      };
    } catch (error: any) {
      console.error('충전 요청 오류:', error);
      return {
        success: false,
        message: error.message || '충전 요청 중 오류가 발생했습니다. 다시 시도해주세요.'
      };
    }
  }

  /**
   * 사용자의 캐시 충전 요청 내역을 조회합니다.
   * @param userId 사용자 ID
   * @param limit 조회할 항목 수
   * @returns 충전 요청 내역 결과
   */
  public static async getChargeRequestHistory(
    userId: string,
    limit: number = 5
  ): Promise<{ success: boolean; message: string; data?: any[] }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // 캐시 충전 요청 내역 조회
      const { data, error } = await supabase
        .from('cash_charge_requests')
        .select('id, amount, status, requested_at, free_cash_percentage')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`충전 요청 내역 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        message: '충전 요청 내역 조회 성공',
        data: data || []
      };
    } catch (error: any) {
      console.error('충전 요청 내역 조회 오류:', error);
      return {
        success: false,
        message: error.message || '충전 요청 내역 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자의 캐시 사용 내역을 조회합니다.
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @returns 캐시 사용 내역 결과
   */
  public static async getCashHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
    totalItems?: number;
  }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // 총 항목 수 조회
      const { count, error: countError } = await supabase
        .from('user_cash_history')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (countError) {
        throw new Error(`캐시 내역 카운트 실패: ${countError.message}`);
      }

      // 페이지네이션 계산
      const offset = (page - 1) * limit;
      const end = offset + limit - 1;

      // 캐시 내역 조회
      const { data, error } = await supabase
        .from('user_cash_history')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_at', { ascending: false })
        .range(offset, end);

      if (error) {
        throw new Error(`캐시 내역 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        message: '캐시 내역 조회 성공',
        data: data || [],
        totalItems: count || 0
      };
    } catch (error: any) {
      console.error('캐시 내역 조회 오류:', error);
      return {
        success: false,
        message: error.message || '캐시 내역 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자의 현재 캐시 잔액을 조회합니다.
   * @param userId 사용자 ID
   * @returns 캐시 잔액 정보
   */
  public static async getUserBalance(
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      paid_balance: number;
      free_balance: number;
      total_balance: number;
    };
  }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // 사용자 잔액 조회
      const { data, error } = await supabase
        .from('user_balances')
        .select('paid_balance, free_balance, total_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`잔액 조회 실패: ${error.message}`);
      }

      // 잔액 정보가 없으면 0으로 초기화
      const balance = data || {
        paid_balance: 0,
        free_balance: 0,
        total_balance: 0
      };

      return {
        success: true,
        message: '잔액 조회 성공',
        data: balance
      };
    } catch (error: any) {
      console.error('잔액 조회 오류:', error);
      return {
        success: false,
        message: error.message || '잔액 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 적용 가능한 캐시 설정을 조회합니다.
   * @param userId 사용자 ID
   * @returns 캐시 설정 정보
   */
  public static async getCashSetting(
    userId: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // 사용자별 설정 확인
      const { data: userSetting, error: userSettingError } = await supabase
        .from('cash_user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      // 전역 설정 확인
      const { data: globalSetting, error: globalSettingError } = await supabase
        .from('cash_global_settings')
        .select('*')
        .single();

      if (globalSettingError) {
        throw new Error(`전역 설정 조회 실패: ${globalSettingError.message}`);
      }

      // 사용자별 설정이 있으면 사용자 설정, 없으면 전역 설정 사용
      const setting = userSetting || globalSetting;

      return {
        success: true,
        message: '캐시 설정 조회 성공',
        data: setting
      };
    } catch (error: any) {
      console.error('캐시 설정 조회 오류:', error);
      return {
        success: false,
        message: error.message || '캐시 설정 조회 중 오류가 발생했습니다.'
      };
    }
  }
}