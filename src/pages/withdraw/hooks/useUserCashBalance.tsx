import { useState, useEffect } from 'react';
import { getUserCashBalance } from '../services/withdrawService';

interface UseUserCashBalanceReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 사용자 캐시 잔액을 조회하는 커스텀 훅
 * @param userId 사용자 ID
 * @returns 캐시 잔액, 로딩 상태, 에러 메시지, 다시 불러오기 함수
 */
export const useUserCashBalance = (userId?: string): UseUserCashBalanceReturn => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 캐시 잔액 조회
  const fetchUserCashBalance = async () => {
    if (!userId) {
      setError('사용자 정보가 없습니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cashBalance = await getUserCashBalance(userId);
      setBalance(cashBalance);
    } catch (err) {
      
      setError('캐시 잔액을 불러오는데 실패했습니다.');
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 캐시 잔액 조회
  useEffect(() => {
    if (userId) {
      fetchUserCashBalance();
    }
  }, [userId]);
  
  // 다시 불러오기 함수
  const refetch = async () => {
    await fetchUserCashBalance();
  };

  return {
    balance,
    isLoading,
    error,
    refetch
  };
};
