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
      const redirectTarget = localStorage.getItem('auth_redirect');
      const logoutTimestamp = localStorage.getItem('logout_timestamp');
      
      // 로그인 페이지 감지
      const isLoginPage = window.location.hash.includes('/auth/login');
      
      if (redirectTarget === 'login' && logoutTimestamp) {
        // 로그아웃 시점과 현재 시간 차이 계산 (5초 이내면 상태 유지)
        const timestamp = parseInt(logoutTimestamp, 10);
        const now = Date.now();
        const elapsed = now - timestamp;
        
        if (elapsed < 5000) { // 5초
          // 로그아웃 중 상태로 표시
          setIsLoggingOut(true);
          
          // 로그인 페이지인 경우 짧은 지연 후 상태 초기화
          if (isLoginPage) {
            setTimeout(() => {
              setIsLoggingOut(false);
              localStorage.removeItem('auth_redirect');
              localStorage.removeItem('logout_timestamp');
            }, 100); // 화면이 안정화되는 데 충분한 시간
          }
        } else {
          // 시간이 지나면 로그아웃 관련 상태 정리
          localStorage.removeItem('auth_redirect');
          localStorage.removeItem('logout_timestamp');
        }
      } else if (isLoginPage) {
        // 로그인 페이지에 직접 접근한 경우
        document.body.classList.add('auth-page');
      }
    };
    
    // 초기 실행
    handleLogoutState();
    
    // 해시 변경 이벤트 리스너 추가
    const handleHashChange = () => {
      // URL 해시가 변경될 때도 상태 확인
      handleLogoutState();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [setIsLoggingOut]);

  // 로그아웃 상태일 때 트랜지션 비활성화 및 부드러운 화면 전환
  useEffect(() => {
    if (isLoggingOut) {
      // 로그아웃 중 트랜지션 및 애니메이션 비활성화
      const styleEl = document.createElement('style');
      styleEl.id = 'logout-style';
      styleEl.innerHTML = `
        body, #root, .app, main, * {
          transition: none !important;
          animation: none !important;
          opacity: 1 !important;
        }
        
        /* 로그인 페이지가 깜빡거림 없이 즉시 표시되도록 처리 */
        body.auth-page #root {
          opacity: 1 !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(styleEl);
      
      // 페이지 내용이 완전히 로드될 때까지 스크롤 차단
      document.body.style.overflow = 'hidden';
      
      return () => {
        const existingStyle = document.getElementById('logout-style');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.body.style.overflow = '';
      };
    }
  }, [isLoggingOut]);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, setIsLoggingOut }}>
      {children}
    </LogoutContext.Provider>
  );
};