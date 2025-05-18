/**
 * 로그아웃 안전 모듈 - 로그아웃 중 404 오류 및 화면 깜빡임 방지를 위한 유틸리티
 */

/**
 * 로그아웃 관련 스토리지 및 상태를 정리하는 함수
 * 이 함수를 직접 호출하여 로그아웃 상태 관련 정보를 정리할 수 있습니다
 */
export const cleanupLogoutState = (): void => {
  // 로컬 스토리지 정리
  if (typeof localStorage !== 'undefined') {
    try {
      // 로그아웃 관련 키 제거
      const keys = [
        'auth_redirect', 
        'logout_timestamp', 
        'force_logout',
        'force_logout_timestamp', 
        'force_logout_error'
      ];
      
      keys.forEach(key => {
        try { localStorage.removeItem(key); } catch (_) {}
      });
    } catch (_) {}
  }
  
  // 세션 스토리지 정리
  if (typeof sessionStorage !== 'undefined') {
    try {
      const sessionKeys = [
        'direct_to_login', 
        'logout_complete', 
        'logout_redirect',
        'logout_timestamp', 
        'logout_error'
      ];
      
      sessionKeys.forEach(key => {
        try { sessionStorage.removeItem(key); } catch (_) {}
      });
    } catch (_) {}
  }
  
  // 쿠키 정리
  if (typeof document !== 'undefined') {
    try {
      document.cookie = "fallback_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "force_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (_) {}
  }
};

/**
 * 로그아웃 프로세스를 실행하는 함수
 * - 상태를 먼저 변경하고 그 다음 URL 변경을 실행
 * - 깜빡임 방지를 위해 조정된 동작 순서
 */
export const syncedLogout = async (
  clearAuthFn: () => void,
  navigate: (path: string) => void,
  setLogoutState: (state: boolean) => void
): Promise<void> => {
  // 1. 로그아웃 중 상태 설정 (화면 렌더링 차단용)
  setLogoutState(true);
  
  // 2. 짧은 대기 - 로그아웃 상태가 React 렌더링 사이클에 적용되도록 함
  await new Promise(resolve => setTimeout(resolve, 10));
  
  try {
    // 3. 인증 상태 초기화 (동기 작업)
    clearAuthFn();
    
    // 4. 스토리지 정리 (동기 작업)
    cleanupLogoutState();
    
    // 5. 짧은 대기 - 모든 클리어 작업이 완료될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 6. 로그인 페이지로 이동
    const timestamp = new Date().getTime();
    navigate(`/auth/login?t=${timestamp}`);
    
    // 7. DOM 업데이트를 위한 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  } finally {
    // 8. 로그아웃 중 상태 종료 (100ms 후)
    setTimeout(() => {
      setLogoutState(false);
    }, 100);
  }
};

// 로그인 페이지로 이동할 때 로그아웃 상태 정리하는 이벤트 리스너
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const isLoginPage = 
      window.location.hash.includes('auth/login') || 
      window.location.hash.includes('/auth/login');
    
    // 로그인 페이지에 도달했을 때 상태 정리
    if (isLoginPage) {
      cleanupLogoutState();
    }
  });
}