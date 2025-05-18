/**
 * 로그아웃 안전 모듈 - 로그아웃 중 404 오류 방지를 위한 단순화된 유틸리티
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