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
    amount: number,
    depositorName?: string
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
        
      }

      // 사용자별 설정이 있으면 사용, 없으면 전역 설정 사용
      const setting = userSettingData || globalSettingData;
      
      // 최소 충전 금액보다 적으면 무료 캐시 비율을 0으로 설정
      let freeCashPercentage = 0;
      if (setting && amount >= setting.min_request_amount) {
        freeCashPercentage = setting.free_cash_percentage || 0;
      }
      
      

      // 충전 요청 생성
      const { data, error } = await supabase
        .from('cash_charge_requests')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'pending',
          free_cash_percentage: freeCashPercentage,
          requested_at: new Date().toISOString(),
          account_holder: depositorName || null
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
        .select('id, amount, status, requested_at, free_cash_percentage, account_holder')
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
      
      return {
        success: false,
        message: error.message || '캐시 내역 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자의 캐시 사용 내역을 필터와 함께 조회합니다.
   * @param userId 사용자 ID
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @param filterType 필터 타입 (all, charge, use, refund)
   * @returns 캐시 사용 내역 결과
   */
  public static async getCashHistoryWithFilter(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filterType: 'all' | 'charge' | 'use' | 'refund' = 'all'
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

      let countQuery = supabase
        .from('user_cash_history_detailed')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      let dataQuery = supabase
        .from('user_cash_history_detailed')
        .select('*')
        .eq('user_id', userId);

      // 필터 적용
      if (filterType !== 'all') {
        switch (filterType) {
          case 'charge':
            countQuery = countQuery.in('transaction_type', ['charge', 'free', 'referral_bonus']);
            dataQuery = dataQuery.in('transaction_type', ['charge', 'free', 'referral_bonus']);
            break;
          case 'use':
            countQuery = countQuery.in('transaction_type', ['purchase', 'buy', 'work']);
            dataQuery = dataQuery.in('transaction_type', ['purchase', 'buy', 'work']);
            break;
          case 'refund':
            countQuery = countQuery.in('transaction_type', ['refund', 'withdrawal']);
            dataQuery = dataQuery.in('transaction_type', ['refund', 'withdrawal']);
            break;
        }
      }

      // 총 항목 수 조회
      const { count, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`캐시 내역 카운트 실패: ${countError.message}`);
      }

      // 페이지네이션 계산
      const offset = (page - 1) * limit;
      const end = offset + limit - 1;

      // 캐시 내역 조회
      const { data, error } = await dataQuery
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
      
      return {
        success: false,
        message: error.message || '캐시 설정 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자의 캐시 내역을 날짜 범위와 타입별로 조회합니다.
   * @param userId 사용자 ID
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @param transactionType 거래 유형 (선택)
   * @returns 캐시 내역 결과
   */
  public static async getCashHistoryByDateRange(
    userId: string,
    startDate?: string,
    endDate?: string,
    transactionType?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      let query = supabase
        .from('user_cash_history')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_at', { ascending: false });

      // 날짜 필터 적용
      if (startDate) {
        query = query.gte('transaction_at', startDate);
      }
      if (endDate) {
        query = query.lte('transaction_at', endDate);
      }

      // 거래 유형 필터 적용
      if (transactionType && transactionType !== 'all') {
        // 여러 유형을 그룹으로 처리
        switch (transactionType) {
          case 'charge':
            query = query.in('transaction_type', ['charge', 'free', 'referral_bonus']);
            break;
          case 'use':
            query = query.in('transaction_type', ['purchase', 'buy', 'work']);
            break;
          case 'refund':
            query = query.in('transaction_type', ['refund', 'withdrawal']);
            break;
          default:
            query = query.eq('transaction_type', transactionType);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`캐시 내역 조회 실패: ${error.message}`);
      }

      return {
        success: true,
        message: '캐시 내역 조회 성공',
        data: data || []
      };
    } catch (error: any) {
      
      return {
        success: false,
        message: error.message || '캐시 내역 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 자동 완료 환불의 관련 슬롯 정보를 조회합니다.
   * @param userId 사용자 ID
   * @param transactionDate 환불 거래 일시
   * @param amount 환불 금액
   * @returns 관련 슬롯 정보
   */
  public static async getAutoRefundSlots(
    userId: string,
    transactionDate: string,
    amount: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
  }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // 환불 시점 전후 1시간 내에 완료된 슬롯들을 검색
      const startTime = new Date(new Date(transactionDate).getTime() - 60 * 60 * 1000).toISOString();
      const endTime = new Date(new Date(transactionDate).getTime() + 60 * 60 * 1000).toISOString();

      console.log('자동 환불 슬롯 검색 조건:', {
        userId,
        transactionDate,
        startTime,
        endTime,
        amount
      });

      // 기본 슬롯 정보만 먼저 가져오기
      const { data: slotsData, error } = await supabase
        .from('slots')
        .select(`
          id,
          user_slot_number,
          status,
          processed_at,
          start_date,
          end_date,
          quantity,
          input_data,
          keyword_id,
          product_id
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('processed_at', startTime)
        .lte('processed_at', endTime)
        .order('processed_at', { ascending: false });

      if (error) {
        console.error('Supabase 쿼리 에러:', error);
        throw new Error(`자동 환불 슬롯 조회 실패: ${error.message}`);
      }

      console.log('기본 슬롯 데이터:', slotsData);

      // 슬롯이 없으면 빈 배열 반환
      if (!slotsData || slotsData.length === 0) {
        return {
          success: true,
          message: '자동 환불 슬롯 조회 성공',
          data: []
        };
      }

      // 캠페인 정보 별도로 가져오기
      const productIds = slotsData.map(slot => slot.product_id).filter(Boolean);
      let campaignsData: any[] = [];
      
      if (productIds.length > 0) {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, campaign_name, service_type')
          .in('id', productIds);
        campaignsData = campaigns || [];
      }

      // 키워드 정보 별도로 가져오기
      const keywordIds = slotsData.map(slot => slot.keyword_id).filter(Boolean);
      let keywordsData: any[] = [];
      
      if (keywordIds.length > 0) {
        const { data: keywords } = await supabase
          .from('keywords')
          .select('id, main_keyword, keyword1, keyword2, keyword3')
          .in('id', keywordIds);
        keywordsData = keywords || [];
      }

      // 데이터 조합
      const enrichedSlots = slotsData.map(slot => ({
        ...slot,
        campaigns: campaignsData.find(c => c.id === slot.product_id) || null,
        keywords: keywordsData.find(k => k.id === slot.keyword_id) || null
      }));

      console.log('최종 조합된 슬롯 데이터:', enrichedSlots);

      return {
        success: true,
        message: '자동 환불 슬롯 조회 성공',
        data: enrichedSlots
      };
    } catch (error: any) {
      
      return {
        success: false,
        message: error.message || '자동 환불 슬롯 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 월별 캐시 사용 통계를 조회합니다.
   * @param userId 사용자 ID
   * @param year 연도
   * @param month 월
   * @returns 월별 통계
   */
  public static async getMonthlyStatistics(
    userId: string,
    year: number,
    month: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      totalCharged: number;
      totalUsed: number;
      totalRefunded: number;
      chargeCount: number;
      useCount: number;
      refundCount: number;
    };
  }> {
    try {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('user_cash_history')
        .select('transaction_type, amount')
        .eq('user_id', userId)
        .gte('transaction_at', startDate)
        .lte('transaction_at', endDate);

      if (error) {
        throw new Error(`통계 조회 실패: ${error.message}`);
      }

      const stats = {
        totalCharged: 0,
        totalUsed: 0,
        totalRefunded: 0,
        chargeCount: 0,
        useCount: 0,
        refundCount: 0
      };

      data?.forEach(transaction => {
        switch (transaction.transaction_type) {
          case 'charge':
          case 'free':
          case 'referral_bonus':
            stats.totalCharged += transaction.amount;
            stats.chargeCount++;
            break;
          case 'purchase':
          case 'buy':
          case 'work':
          case 'withdrawal':
            stats.totalUsed += Math.abs(transaction.amount);
            stats.useCount++;
            break;
          case 'refund':
            stats.totalRefunded += transaction.amount;
            stats.refundCount++;
            break;
        }
      });

      return {
        success: true,
        message: '월별 통계 조회 성공',
        data: stats
      };
    } catch (error: any) {
      
      return {
        success: false,
        message: error.message || '통계 조회 중 오류가 발생했습니다.'
      };
    }
  }
}