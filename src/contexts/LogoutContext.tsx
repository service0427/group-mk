import React, { createContext, useContext, useState, useEffect } from 'react';

interface LogoutContextType {
  isLoggingOut: boolean;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
}

const LogoutContext = createContext<LogoutContextType>({
  isLoggingOut: false,
  setIsLoggingOut: () => {}
});

export const useLogoutContext = () => useContext(LogoutContext);

export const LogoutProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // 로그아웃 상태 관리
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 페이지 로드 시 로그아웃 상태 확인 및 부드러운 화면 처리
  useEffect(() => {
    // 로그아웃 상태 확인 및 로그인 페이지 초기화
    const handleLogoutState = () => {
      // 브라우저 환경에서만 localStorage 접근
      const redirectTarget = typeof localStorage !== 'undefined' ? 
        localStorage.getItem('auth_redirect') : null;
      const logoutTimestamp = typeof localStorage !== 'undefined' ? 
        localStorage.getItem('logout_timestamp') : null;
      const forceLogoutTimestamp = typeof localStorage !== 'undefined' ? 
        localStorage.getItem('force_logout_timestamp') : null;
      
      // 브라우저 환경에서 안전하게 로그인 페이지 감지
      // URL에 강제 로딩 플래그가 있는지 확인
      // 해시 경로가 'auth/login'(슬래시 사용) 또는 '#/auth/login'(#/ 사용) 둘 다 지원
      const isLoginPage = typeof window !== 'undefined' ? 
        (window.location.hash.includes('auth/login') || 
         window.location.hash.includes('/auth/login') || 
         window.location.pathname.includes('/auth/login')) : 
        false;
      
      // 강제 리로드 요청 확인 (로그아웃으로 인한 리로드인지)
      const isForceReload = typeof window !== 'undefined' ? 
        (window.location.href.includes('force=true') || 
         localStorage.getItem('force_logout') === 'true') : 
        false;
        
      // fallback 쿠키 체크 - 로그아웃 실패 시 복구 메커니즘
      const hasFallbackLogoutCookie = typeof document !== 'undefined' ? 
        document.cookie.includes('fallback_logout=') : false;
      
      // fallback 쿠키가 있으면 로그아웃 상태로 처리 (가장 높은 우선순위)
      if (hasFallbackLogoutCookie) {
        setIsLoggingOut(true);
        
        // 로그인 페이지에서만 처리
        if (isLoginPage) {
          // 상태 완전 초기화
          setIsLoggingOut(false);
          
          // 로컬 스토리지 및 세션 스토리지 정리
          if (typeof localStorage !== 'undefined') {
            // 모든 로그아웃 관련 플래그 제거
            localStorage.removeItem('auth_redirect');
            localStorage.removeItem('logout_timestamp');
            localStorage.removeItem('force_logout');
            localStorage.removeItem('force_logout_timestamp');
            localStorage.removeItem('force_logout_error');
            
            // Supabase 관련 항목 제거
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
          }
          
          // 세션 스토리지 정리
          if (typeof sessionStorage !== 'undefined') {
            try { 
              sessionStorage.clear(); 
            } catch (e) { 
              // 무시
            }
          }
          
          // fallback 쿠키 제거
          if (typeof document !== 'undefined') {
            document.cookie = "fallback_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "force_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            
            // 메타 태그 제거
            const logoutMeta = document.querySelector('meta[name="app-logout-state"]');
            if (logoutMeta) {
              logoutMeta.remove();
            }
          }
        }
      }
      // force_logout_timestamp가 있으면 (새로운 강제 로그아웃 메커니즘)
      else if (forceLogoutTimestamp && isLoginPage) {
        const timestamp = parseInt(forceLogoutTimestamp, 10);
        const now = Date.now();
        const elapsed = now - timestamp;
        
        // 10초 이내면 로그아웃 플래그 유지
        if (elapsed < 10000) {
          setIsLoggingOut(true);
          
          // 약간의 지연 후 정리
          setTimeout(() => {
            setIsLoggingOut(false);
            
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('force_logout');
              localStorage.removeItem('force_logout_timestamp');
              localStorage.removeItem('force_logout_error');
            }
          }, 500);
        } else {
          // 시간이 지나면 강제 로그아웃 관련 상태 정리
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('force_logout');
            localStorage.removeItem('force_logout_timestamp');
            localStorage.removeItem('force_logout_error');
          }
        }
      }
      // 기존 로그아웃 메커니즘 
      else if (redirectTarget === 'login' && logoutTimestamp) {
        // 로그아웃 시점과 현재 시간 차이 계산 (5초 이내면 상태 유지)
        const timestamp = parseInt(logoutTimestamp, 10);
        const now = Date.now();
        const elapsed = now - timestamp;
        
        if (elapsed < 5000) { // 5초
          // 로그아웃 중 상태로 표시
          setIsLoggingOut(true);
          
          // 로그인 페이지인 경우 짧은 지연 후 상태 초기화
          if (isLoginPage) {
            // 강제 리로드인 경우 즉시 로그아웃 완료 처리
            if (isForceReload) {
              // 지연 없이 즉시 처리
              setIsLoggingOut(false);
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('auth_redirect');
                localStorage.removeItem('logout_timestamp');
              }
              
              // 메타 태그 제거
              if (typeof document !== 'undefined') {
                const logoutMeta = document.querySelector('meta[name="app-logout-state"]');
                if (logoutMeta) {
                  logoutMeta.remove();
                }
              }
            } else {
              // 일반적인 경우 약간의 지연 후 처리
              setTimeout(() => {
                setIsLoggingOut(false);
                if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem('auth_redirect');
                  localStorage.removeItem('logout_timestamp');
                }
              }, 100); // 화면이 안정화되는 데 충분한 시간
            }
          }
        } else {
          // 시간이 지나면 로그아웃 관련 상태 정리
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('auth_redirect');
            localStorage.removeItem('logout_timestamp');
          }
        }
      } else if (isLoginPage && typeof document !== 'undefined') {
        // 로그인 페이지에 직접 접근한 경우 (브라우저 환경에서만)
        document.body.classList.add('auth-page');
        
        // 강제 로그아웃 상태에서 온 것이 맞는지 확인
        if (isForceReload) {
          // 로그아웃 관련 저장소 정리
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('auth_redirect');
            localStorage.removeItem('logout_timestamp');
            localStorage.removeItem('force_logout');
            localStorage.removeItem('force_logout_timestamp');
            localStorage.removeItem('force_logout_error');
          }
          
          // 메타 태그 확인 및 제거
          const logoutMeta = document.querySelector('meta[name="app-logout-state"]');
          if (logoutMeta) {
            logoutMeta.remove();
          }
          
          // fallback 쿠키 제거
          document.cookie = "fallback_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "force_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      }
    };
    
    // 초기 실행
    handleLogoutState();
    
    // 브라우저 환경에서만 해시 변경 이벤트 리스너 추가
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        // URL 해시가 변경될 때도 상태 확인
        handleLogoutState();
      };
      
      window.addEventListener('hashchange', handleHashChange);
      
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, [setIsLoggingOut]);

  // 로그아웃 상태에 대한 효과는 제거하고 상태만 유지
  useEffect(() => {
    // 아무 효과 없음 - 전환 효과 제거됨
  }, [isLoggingOut]);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut }}>
      {children}
    </LogoutContext.Provider>
  );
};