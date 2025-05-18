import React, { createContext, useContext, useState, useEffect } from 'react';

// API 콜 관리를 위한 확장된 LogoutContext 타입
interface LogoutContextType {
  isLoggingOut: boolean;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
  // API 호출 안전 래퍼 함수 - 로그아웃 중에는 API 호출을 방지합니다
  safeApiCall: <T>(apiCall: () => Promise<T>, fallback: T) => Promise<T>;
}

const LogoutContext = createContext<LogoutContextType>({
  isLoggingOut: false,
  setIsLoggingOut: () => { },
  safeApiCall: async (apiCall, fallback) => fallback
});

export const useLogoutContext = () => useContext(LogoutContext);

export const LogoutProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // 로그아웃 상태 관리 (기본값 false)
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 안전한 API 호출 래퍼 - 로그아웃 중이면 API 호출을 방지하고 기본값 반환
  const safeApiCall = async <T,>(apiCall: () => Promise<T>, fallback: T): Promise<T> => {
    // 로그아웃 중이면 API 호출을 건너뛰고 fallback 값 반환
    if (isLoggingOut) {
      console.log('로그아웃 중에 API 호출이 방지되었습니다.');
      return fallback;
    }
    
    try {
      // 로그아웃 상태가 아니면 API 호출 실행
      return await apiCall();
    } catch (error) {
      // API 오류 발생 시, 로그아웃 중인지 재확인 후 오류 처리
      if (isLoggingOut) {
        console.log('API 호출 중 로그아웃이 시작되어 오류를 무시합니다.');
        return fallback;
      }
      
      // 그 외 오류는 다시 던지기
      throw error;
    }
  };

  // 페이지 로드 시 로그아웃 상태 확인 - 전환 효과 제거하고 바로 이동
  useEffect(() => {
    // 로그아웃 상태 확인 및 쿠키/스토리지 정리 함수
    const cleanupLogoutState = () => {
      try {
        // 1. localStorage 정리
        if (typeof localStorage !== 'undefined') {
          // 모든 로그아웃 관련 플래그 제거
          const keysToRemove = [
            'auth_redirect', 'logout_timestamp', 'force_logout',
            'force_logout_timestamp', 'force_logout_error'
          ];

          keysToRemove.forEach(key => {
            try { localStorage.removeItem(key); } catch { }
          });

          // Supabase 관련 항목 제거 (로그인 페이지에서만)
          if (typeof window !== 'undefined' &&
            (window.location.hash.includes('auth/login') || window.location.hash.includes('/auth/login'))) {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                try { localStorage.removeItem(key); } catch { }
              }
            });
          }
        }

        // 2. sessionStorage 정리
        if (typeof sessionStorage !== 'undefined') {
          const sessionKeysToRemove = [
            'direct_to_login', 'logout_complete', 'logout_redirect',
            'logout_timestamp', 'logout_error'
          ];

          sessionKeysToRemove.forEach(key => {
            try { sessionStorage.removeItem(key); } catch { }
          });
        }

        // 3. fallback 쿠키 제거
        if (typeof document !== 'undefined') {
          document.cookie = "fallback_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "force_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          // 메타 태그 제거
          const logoutMeta = document.querySelector('meta[name="app-logout-state"]');
          if (logoutMeta) {
            logoutMeta.remove();
          }
        }
      } catch (e) {
        console.error("로그아웃 상태 정리 중 오류", e);
      }
    };

    // URL 파라미터 정리 함수
    const cleanupUrlParams = () => {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        try {
          // URL에 force=true 또는 error 파라미터가 있는지 확인
          const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
          const hasLogoutParams = urlParams.get('force') === 'true' ||
            urlParams.has('error') ||
            urlParams.has('safety') ||
            urlParams.has('emergency');

          if (hasLogoutParams) {
            // 현재 URL에서 파라미터만 제거
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

    // 로그인 페이지 체크
    const isLoginPage = typeof window !== 'undefined' && (
      window.location.hash.includes('auth/login') ||
      window.location.hash.includes('/auth/login')
    );

    // 로그인 페이지인 경우 스토리지와 URL 정리
    if (isLoginPage) {
      // 모든 로그아웃 관련 상태 정리
      cleanupLogoutState();
      // URL 파라미터 정리
      cleanupUrlParams();
    }

    // 해시 변경 이벤트에서 로그인 페이지로 이동했을 때만 처리 (1회만 실행)
    const handleHashChange = () => {
      const currentIsLoginPage = typeof window !== 'undefined' && (
        window.location.hash.includes('auth/login') ||
        window.location.hash.includes('/auth/login')
      );

      if (currentIsLoginPage) {
        // URLSearchParams로 쿼리 파라미터 확인
        const hashParts = window.location.hash.split('?');
        if (hashParts.length > 1) {
          const params = new URLSearchParams(hashParts[1]);
          // 로그아웃 관련 파라미터가 있는 경우에만 정리 (첫 로드 시에만)
          if (params.has('_') || params.has('force') || params.has('error')) {
            cleanupLogoutState();
            cleanupUrlParams();

            // 이벤트 리스너 제거하여 한 번만 실행되도록 함
            window.removeEventListener('hashchange', handleHashChange);
          }
        }
      }
    };

    // 이벤트 리스너 등록
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, []);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut, safeApiCall }}>
      {children}
    </LogoutContext.Provider>
  );
};