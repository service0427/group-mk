import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LogoutService } from '@/services/auth/LogoutService';
import { SafeHashNavigation } from '@/utils/safeHashNavigation';

/**
 * 개선된 LogoutContext 타입
 * LogoutService와 통합하여 일관된 로그아웃 상태 관리
 */
interface LogoutContextType {
  isLoggingOut: boolean;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
  // API 호출 안전 래퍼 함수 - 로그아웃 중에는 API 호출을 방지합니다
  safeApiCall: <T>(apiCall: () => Promise<T>, fallback: T) => Promise<T>;
  // 로그아웃 진행률 (0-100)
  logoutProgress: number;
}

const LogoutContext = createContext<LogoutContextType>({
  isLoggingOut: false,
  setIsLoggingOut: () => { },
  safeApiCall: async (apiCall, fallback) => fallback,
  logoutProgress: 0
});

export const useLogoutContext = () => useContext(LogoutContext);

export const LogoutProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // 로그아웃 상태 관리
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const logoutService = LogoutService.getInstance();
  
  // LogoutService 이벤트 리스너 설정
  useEffect(() => {
    // 로그아웃 시작 이벤트
    const unsubscribeStart = logoutService.onLogoutStart(() => {
      setIsLoggingOut(true);
      setLogoutProgress(0);
    });
    
    // 로그아웃 완료 이벤트
    const unsubscribeComplete = logoutService.onLogoutComplete((result) => {
      setLogoutProgress(100);
      
      // 성공/실패와 관계없이 일정 시간 후 상태 초기화
      setTimeout(() => {
        setIsLoggingOut(false);
        setLogoutProgress(0);
      }, 300);
      
      if (!result.success) {
        // console.error('[LogoutContext] 로그아웃 실패:', result.error);
      }
    });
    
    return () => {
      unsubscribeStart();
      unsubscribeComplete();
    };
  }, [logoutService]);
  
  // 안전한 API 호출 래퍼 - 로그아웃 중이면 API 호출을 방지하고 기본값 반환
  const safeApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>, 
    fallback: T
  ): Promise<T> => {
    // LogoutService의 상태도 함께 확인
    if (isLoggingOut || logoutService.isLoggingOut()) {
      // console.warn('[LogoutContext] 로그아웃 중 API 호출 차단됨');
      return fallback;
    }
    
    try {
      // 로그아웃 상태가 아니면 API 호출 실행
      return await apiCall();
    } catch (error) {
      // API 오류 발생 시, 로그아웃 중인지 재확인 후 오류 처리
      if (isLoggingOut || logoutService.isLoggingOut()) {
        // console.warn('[LogoutContext] 로그아웃 중 API 오류 무시됨');
        return fallback;
      }
      
      // 그 외 오류는 다시 던지기
      throw error;
    }
  }, [isLoggingOut, logoutService]);

  // 페이지 로드 시 로그아웃 상태 확인 및 URL 정리
  useEffect(() => {
    // URL 파라미터 정리 함수
    const cleanupUrlParams = () => {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        try {
          const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
          const hasLogoutParams = urlParams.has('t') || 
            urlParams.has('force') || 
            urlParams.has('error');

          if (hasLogoutParams) {
            const cleanPath = window.location.hash.split('?')[0];
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + cleanPath
            );
          }
        } catch (_) {
          // 무시
        }
      }
    };

    // 현재 페이지 확인 및 정리
    const checkAndCleanup = () => {
      const currentPath = SafeHashNavigation.getCurrentHashPath();
      const isLoginPage = currentPath.includes('/auth/login');

      if (isLoginPage) {
        // 로그인 페이지에서는 로그아웃 상태 해제
        setIsLoggingOut(false);
        setLogoutProgress(0);
        cleanupUrlParams();
      }
    };

    // 초기 체크
    checkAndCleanup();

    // 해시 변경 감지
    const unsubscribe = SafeHashNavigation.onHashChange((path) => {
      checkAndCleanup();
    });

    return unsubscribe;
  }, []);

  // Context value
  const contextValue = React.useMemo(() => ({
    isLoggingOut,
    setIsLoggingOut,
    safeApiCall,
    logoutProgress
  }), [isLoggingOut, safeApiCall, logoutProgress]);

  return (
    <LogoutContext.Provider value={contextValue}>
      {children}
    </LogoutContext.Provider>
  );
};