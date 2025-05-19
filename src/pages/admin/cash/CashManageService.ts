import { supabase } from '@/supabase';

/**
 * 캐시 관리 서비스
 * 캐시 충전 요청 승인, 거부 및 관련 처리를 담당
 * 직접 테이블 접근 방식으로 구현
 */
export class CashManageService {
  /**
   * 캐시 충전 요청을 승인합니다.
   * @param requestId 승인할 요청 ID
   * @returns 처리 결과
   */
  public static async approveChargeRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 요청 정보 조회
      const { data: requestData, error: requestError } = await supabase
        .from('cash_charge_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw new Error(`요청 정보 조회 실패: ${requestError.message}`);
      if (!requestData) throw new Error('요청 정보를 찾을 수 없습니다.');

      // 이미 처리된 요청인지 확인
      if (requestData.status !== 'pending') {
        throw new Error(`이미 ${requestData.status === 'approved' ? '승인' : '거부'}된 요청입니다.`);
      }

      // 2. 사용자 캐시 설정 조회 (사용자별 → 전역)
      const { data: userSettingData } = await supabase
        .from('cash_user_settings')
        .select('*')
        .eq('user_id', requestData.user_id)
        .eq('is_active', true)
        .maybeSingle();

      const { data: globalSettingData, error: globalSettingError } = await supabase
        .from('cash_global_settings')
        .select('*')
        .single();

      if (globalSettingError) throw new Error(`전역 설정 조회 실패: ${globalSettingError.message}`);

      // 사용자별 설정이 있으면 사용, 없으면 전역 설정 사용
      const setting = userSettingData || globalSettingData;

      // 3. 사용자 잔액 정보 조회
      const { data: userBalanceData } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', requestData.user_id)
        .maybeSingle();

      // 4. 트랜잭션 시작 (Supabase에서는 클라이언트 측에서 직접 관리)
      // 4.1. cash_charge_requests 상태 업데이트
      const { error: updateError } = await supabase
        .from('cash_charge_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw new Error(`요청 상태 업데이트 실패: ${updateError.message}`);

      // 4.2. 유료 캐시 내역 추가
      const { error: historyError } = await supabase
        .from('user_cash_history')
        .insert({
          user_id: requestData.user_id,
          transaction_type: 'charge',
          amount: requestData.amount,
          description: `캐시 충전 승인`,
          reference_id: requestId,
          transaction_at: new Date().toISOString()
        });

      if (historyError) throw new Error(`내역 추가 실패: ${historyError.message}`);

      // 4.3. 사용자 잔액 업데이트
      let currentPaidBalance = userBalanceData?.paid_balance || 0;
      let currentFreeBalance = userBalanceData?.free_balance || 0;
      let updatedPaidBalance = parseFloat(currentPaidBalance) + parseFloat(requestData.amount);

      // 4.4. 무료 캐시 처리
      let freeAmount = 0;
      let expiryDate = null;
      let freeCashPercentage = 0;

      // 무료 캐시 비율 결정 (cash_charge_requests 테이블에 저장된 값 사용)
      if (requestData.free_cash_percentage > 0) {
        freeCashPercentage = requestData.free_cash_percentage;

        // 설정된 금액 이상인지 다시 한번 확인 (승인 시점의 최소 금액 기준)
        if (setting && parseFloat(requestData.amount) >= setting.min_request_amount) {
          freeAmount = Math.floor((parseFloat(requestData.amount) * freeCashPercentage) / 100);

          // 만료일 계산
          if (setting.expiry_months > 0) {
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + setting.expiry_months);
          }

          // 무료 캐시 내역 추가
          if (freeAmount > 0) {
            const { error: freeHistoryError } = await supabase
              .from('user_cash_history')
              .insert({
                user_id: requestData.user_id,
                transaction_type: 'free',
                amount: freeAmount,
                description: `무료 캐시 (${requestData.amount.toLocaleString()}원의 ${freeCashPercentage}%)`,
                reference_id: requestId,
                mat_id: requestId,
                expired_dt: expiryDate ? expiryDate.toISOString() : null,
                transaction_at: new Date().toISOString()
              });

            if (freeHistoryError) throw new Error(`무료 캐시 내역 추가 실패: ${freeHistoryError.message}`);
          }
        } else {
          
        }
      } else {
        
      }

      // 4.5. 사용자 잔액 테이블 업데이트
      let updatedFreeBalance = parseFloat(currentFreeBalance) + freeAmount;
      let totalBalance = updatedPaidBalance + updatedFreeBalance;

      if (userBalanceData) {
        // 기존 잔액이 있으면 업데이트
        const { error: balanceUpdateError } = await supabase
          .from('user_balances')
          .update({
            paid_balance: updatedPaidBalance,
            free_balance: updatedFreeBalance,
            total_balance: totalBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', requestData.user_id);

        if (balanceUpdateError) throw new Error(`잔액 업데이트 실패: ${balanceUpdateError.message}`);
      } else {
        // 잔액 정보가 없으면 새로 생성
        const { error: balanceInsertError } = await supabase
          .from('user_balances')
          .insert({
            user_id: requestData.user_id,
            paid_balance: updatedPaidBalance,
            free_balance: updatedFreeBalance,
            total_balance: totalBalance,
            updated_at: new Date().toISOString()
          });

        if (balanceInsertError) throw new Error(`잔액 생성 실패: ${balanceInsertError.message}`);
      }

      return {
        success: true,
        message: `${requestData.amount.toLocaleString()}원 충전이 승인되었습니다. ${freeAmount > 0 ? `무료 캐시 ${freeAmount.toLocaleString()}원이 추가 지급되었습니다.` : ''}`
      };
    } catch (error: any) {
      
      return {
        success: false,
        message: error.message || '캐시 충전 승인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 캐시 충전 요청을 거부합니다.
   * @param requestId 거부할 요청 ID
   * @param rejectionReason 거부 사유
   * @returns 처리 결과
   */
  public static async rejectChargeRequest(
    requestId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 요청 정보 조회
      const { data: requestData, error: requestError } = await supabase
        .from('cash_charge_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw new Error(`요청 정보 조회 실패: ${requestError.message}`);
      if (!requestData) throw new Error('요청 정보를 찾을 수 없습니다.');

      // 이미 처리된 요청인지 확인
      if (requestData.status !== 'pending') {
        throw new Error(`이미 ${requestData.status === 'approved' ? '승인' : '거부'}된 요청입니다.`);
      }

      // 2. 요청 상태 업데이트
      const { error: updateError } = await supabase
        .from('cash_charge_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw new Error(`요청 상태 업데이트 실패: ${updateError.message}`);

      return {
        success: true,
        message: `충전 요청이 거부되었습니다. 사유: ${rejectionReason || '사유 없음'}`
      };
    } catch (error: any) {
      
      return {
        success: false,
        message: error.message || '캐시 충전 거부 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 캐시 충전 내역 리스트를 조회합니다.
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @param filters 검색 필터
   * @returns 충전 내역 리스트와 총 개수
   */
  public static async getCashRequestList(
    page: number,
    limit: number,
    filters: {
      status?: string;
      email?: string;
      name?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
    totalItems?: number;
  }> {
    try {
      // 1. 먼저 필터링에 필요한 사용자 ID 조회 (이메일/이름으로 검색 시)
      let userIds: string[] = [];
      if (filters.email || filters.name) {
        let userQuery = supabase.from('users').select('id');

        if (filters.email) {
          userQuery = userQuery.ilike('email', `%${filters.email}%`);
        }

        if (filters.name) {
          userQuery = userQuery.ilike('full_name', `%${filters.name}%`);
        }

        const { data: userData, error: userError } = await userQuery;

        if (userError) throw new Error(`사용자 검색 실패: ${userError.message}`);

        if (userData && userData.length > 0) {
          userIds = userData.map((user) => user.id);
        } else {
          // 검색 조건에 맞는 사용자가 없으면 빈 결과 반환
          return {
            success: true,
            message: '검색 조건에 맞는 결과가 없습니다.',
            data: [],
            totalItems: 0
          };
        }
      }

      // 2. 총 개수 쿼리 구성
      let countQuery = supabase.from('cash_charge_requests').select('id', { count: 'exact' });

      // 기본 필터 적용
      if (filters.status) {
        countQuery = countQuery.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        countQuery = countQuery.gte('requested_at', `${filters.dateFrom}T00:00:00`);
      }
      if (filters.dateTo) {
        countQuery = countQuery.lte('requested_at', `${filters.dateTo}T23:59:59`);
      }

      // 사용자 ID 필터가 있으면 적용
      if (userIds.length > 0) {
        countQuery = countQuery.in('user_id', userIds);
      }

      // 3. 총 개수 쿼리 실행
      const { count, error: countError } = await countQuery;

      if (countError) throw new Error(`카운트 쿼리 실패: ${countError.message}`);

      // 4. 페이지네이션 계산
      const offset = (page - 1) * limit;
      const end = offset + parseInt(limit.toString()) - 1;

      // 5. 데이터 쿼리 구성
      let dataQuery = supabase
        .from('cash_charge_requests')
        .select(`
          id,
          user_id,
          amount,
          deposit_at,
          free_cash_percentage,
          status,
          requested_at,
          processed_at,
          processor_id,
          rejection_reason,
          account_holder
        `);

      // 기본 필터 적용
      if (filters.status) {
        dataQuery = dataQuery.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        dataQuery = dataQuery.gte('requested_at', `${filters.dateFrom}T00:00:00`);
      }
      if (filters.dateTo) {
        dataQuery = dataQuery.lte('requested_at', `${filters.dateTo}T23:59:59`);
      }

      // 사용자 ID 필터가 있으면 적용
      if (userIds.length > 0) {
        dataQuery = dataQuery.in('user_id', userIds);
      }

      // 6. 데이터 쿼리 실행
      const { data: requestsData, error: requestsError } = await dataQuery
        .order('requested_at', { ascending: false })
        .range(offset, end);

      if (requestsError) throw new Error(`데이터 쿼리 실패: ${requestsError.message}`);

      // 7. 결과가 없을 경우
      if (!requestsData || requestsData.length === 0) {
        return {
          success: true,
          message: '조회 결과가 없습니다.',
          data: [],
          totalItems: 0
        };
      }

      // 8. 사용자 정보 가져오기
      const requestUserIds = [...new Set(requestsData.map((item) => item.user_id))];

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', requestUserIds);

      if (usersError) throw new Error(`사용자 정보 조회 실패: ${usersError.message}`);

      // 9. 전역 설정 가져오기
      const { data: globalSettingData, error: globalSettingError } = await supabase
        .from('cash_global_settings')
        .select('*')
        .single();

      if (globalSettingError) throw new Error(`전역 설정 조회 실패: ${globalSettingError.message}`);

      // 10. 사용자별 설정 가져오기
      const { data: userSettingsData, error: userSettingsError } = await supabase
        .from('cash_user_settings')
        .select('*')
        .in('user_id', requestUserIds)
        .eq('is_active', true);

      if (userSettingsError) throw new Error(`사용자별 설정 조회 실패: ${userSettingsError.message}`);

      // 11. 데이터 결합
      // 사용자 정보 매핑
      const userMap = new Map();
      usersData?.forEach((user) => {
        userMap.set(user.id, user);
      });

      // 사용자별 설정 매핑
      const userSettingsMap = new Map();
      userSettingsData?.forEach((setting) => {
        userSettingsMap.set(setting.user_id, setting);
      });

      // 최종 데이터 구성
      const formattedData = requestsData.map((request) => {
        const user = userMap.get(request.user_id);

        // 사용자별 설정이 있으면 사용자 설정, 없으면 전역 설정 사용
        const userSetting = userSettingsMap.get(request.user_id);
        const setting = userSetting || globalSettingData;

        // 무료캐시 조건 충족 여부 확인
        const isEligibleForFreeCash =
          parseFloat(request.amount) >= setting.min_request_amount;

        // 무료캐시 금액 계산
        const freeCashAmount = isEligibleForFreeCash
          ? Math.floor((parseFloat(request.amount) * setting.free_cash_percentage) / 100)
          : 0;

        return {
          id: request.id,
          amount: request.amount,
          deposit_at: request.deposit_at,
          status: request.status,
          requested_at: request.requested_at,
          processed_at: request.processed_at,
          processor_id: request.processor_id,
          rejection_reason: request.rejection_reason,
          account_holder: request.account_holder || '',
          user_id: request.user_id,
          email: user?.email || '정보 없음',
          full_name: user?.full_name || '정보 없음',
          // 무료캐시 관련 정보 추가
          isEligibleForFreeCash,
          freeCashAmount,
          freeCashPercentage: setting.free_cash_percentage,
          minRequestAmount: setting.min_request_amount,
          freeCashExpiryMonths: setting.expiry_months
        };
      });

      return {
        success: true,
        message: '데이터 조회 성공',
        data: formattedData,
        totalItems: count || 0
      };
    } catch (error: any) {
      
      return {
        success: false,
        message: error.message || '캐시 충전 내역 조회 중 오류가 발생했습니다.'
      };
    }
  }
}