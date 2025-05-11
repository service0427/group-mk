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
    
    
    try {
      const settings = await getWithdrawSettings(userId);
      
      setWithdrawSetting(settings);
    } catch (err) {
      
      setError('출금 설정을 불러오는데 실패했습니다.');
      
      // 기본 설정값 사용
      const defaultSettings = {
        min_request_amount: 10000,
        fee_percentage: 3,
        min_fee_amount: 1000,
        max_fee_amount: 5000,
        min_request_percentage: 3
      };
      
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
    
    
    
    if (!withdrawSetting || !amountStr) {
      
      return 0;
    }
    
    const amount = parseInt(amountStr);
    
    
    if (isNaN(amount) || amount <= 0) {
      
      return 0;
    }
    
    // 수수료 계산 (퍼센트 기준)
    // min_request_percentage 또는 fee_percentage 사용 (호환성)
    const feePercentage = withdrawSetting.min_request_percentage !== undefined 
      ? withdrawSetting.min_request_percentage 
      : (withdrawSetting.fee_percentage || 0);
      
    
    let fee = Math.floor((amount * feePercentage) / 100);
    
    
    // 최소/최대 수수료 제한 없음
    
    
    return fee;
  };

  return {
    withdrawSetting,
    isLoading,
    calculateFeeAmount,
    error
  };
};