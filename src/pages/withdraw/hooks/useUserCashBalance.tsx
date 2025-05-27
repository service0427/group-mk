import { useState, useEffect } from 'react';
import { getUserCashBalance } from '../services/withdrawService';
import { useAuthContext } from '@/auth';

interface UseUserCashBalanceReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 사용자 캐시 잔액을 조회하는 커스텀 훅
 * 
 * 비기너 역할의 사용자는 Supabase 호출을 수행하지 않고 항상 0 반환
 * 
 * @param userId 사용자 ID (선택적)
 * @returns 캐시 잔액, 로딩 상태, 에러 메시지, 다시 불러오기 함수
 */
export const useUserCashBalance = (userId?: string): UseUserCashBalanceReturn => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthContext();
  
  // 현재 사용자의 역할
  const userRole = currentUser?.role;

  // 사용자 캐시 잔액 조회
  const fetchUserCashBalance = async () => {
    // 사용자 ID가 없으면 에러 처리
    if (!userId) {
      setError('사용자 정보가 없습니다.');
      return;
    }
    
    // 비기너 역할의 사용자는 항상 잔액 0 사용
    if (userRole === 'beginner') {
      setBalance(0);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 수정된 getUserCashBalance 함수로 역할 정보 전달
      const cashBalance = await getUserCashBalance(userId, userRole);
      setBalance(cashBalance);
    } catch (err) {
      console.error('캐시 잔액 조회 오류:', err);
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
  }, [userId, userRole]); // userRole 의존성 추가
  
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
