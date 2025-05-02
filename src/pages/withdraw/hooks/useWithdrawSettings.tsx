import { useState, useEffect } from 'react';
import { WithdrawSetting, getWithdrawSettings } from '../services/withdrawService';

interface UseWithdrawSettingsReturn {
  withdrawSetting: WithdrawSetting | null;
  isLoading: boolean;
  calculateFeeAmount: (amount: string) => number;
  error: string | null;
}

/**
 * 출금 설정 및 수수료 계산 로직을 제공하는 커스텀 훅
 * @param userId 사용자 ID (선택적)
 * @returns 출금 설정, 로딩 상태, 수수료 계산 함수, 에러 메시지
 */
export const useWithdrawSettings = (userId?: string): UseWithdrawSettingsReturn => {
  const [withdrawSetting, setWithdrawSetting] = useState<WithdrawSetting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 출금 설정 불러오기
  const fetchWithdrawSetting = async () => {
    setIsLoading(true);
    setError(null);
    console.log('fetchWithdrawSetting 호출됨 - userId:', userId);
    
    try {
      const settings = await getWithdrawSettings(userId);
      console.log('받아온 출금 설정:', settings);
      setWithdrawSetting(settings);
    } catch (err) {
      console.error("출금 설정 로딩 오류:", err);
      setError('출금 설정을 불러오는데 실패했습니다.');
      
      // 기본 설정값 사용
      const defaultSettings = {
        min_request_amount: 10000,
        fee_percentage: 3,
        min_fee_amount: 1000,
        max_fee_amount: 5000,
        min_request_percentage: 3
      };
      console.log('기본값으로 설정:', defaultSettings);
      setWithdrawSetting(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 출금 설정 가져오기
  useEffect(() => {
    fetchWithdrawSetting();
  }, [userId]); // userId가 변경될 때마다 다시 불러오기
  
  // 수수료 금액 계산
  const calculateFeeAmount = (amountStr: string): number => {
    console.log('calculateFeeAmount 호출됨 - amountStr:', amountStr);
    console.log('withdrawSetting 값:', withdrawSetting);
    
    if (!withdrawSetting || !amountStr) {
      console.log('withdrawSetting 또는 amountStr이 유효하지 않음');
      return 0;
    }
    
    const amount = parseInt(amountStr);
    console.log('parseInt 결과:', amount);
    
    if (isNaN(amount) || amount <= 0) {
      console.log('금액이 유효하지 않음');
      return 0;
    }
    
    // 수수료 계산 (퍼센트 기준)
    // min_request_percentage 또는 fee_percentage 사용 (호환성)
    const feePercentage = withdrawSetting.min_request_percentage !== undefined 
      ? withdrawSetting.min_request_percentage 
      : (withdrawSetting.fee_percentage || 0);
      
    console.log('사용할 수수료 비율:', feePercentage);
    let fee = Math.floor((amount * feePercentage) / 100);
    console.log('계산된 퍼센트 수수료:', fee);
    
    // 최소/최대 수수료 제한 없음
    
    console.log('최종 계산된 수수료:', fee);
    return fee;
  };

  return {
    withdrawSetting,
    isLoading,
    calculateFeeAmount,
    error
  };
};