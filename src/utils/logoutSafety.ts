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
 * - 하드 리디렉션 사용 (React 라우터 우회)
 * - 깜빡임 방지를 위해 오버레이 즉시 표시 후 리디렉션
 */
export const syncedLogout = async (
  clearAuthFn: () => void,
  navigate: (path: string) => void, // 이 함수는 사용하지 않고 하드 리디렉션 사용
  setLogoutState: (state: boolean) => void
): Promise<void> => {
  // 1. 로그아웃 중 상태 즉시 설정 (오버레이 활성화)
  setLogoutState(true);
  
  // 2. 매우 짧은 대기 - 오버레이가 렌더링될 시간 확보
  await new Promise(resolve => setTimeout(resolve, 5));
  
  try {
    // 3. 인증 상태 정리 (동기 작업)
    clearAuthFn();
    cleanupLogoutState();
    
    // 4. 주요 함수: 하드 리디렉션 사용 - React 라우터 완전히 우회
    const timestamp = new Date().getTime();
    const loginPath = `/auth/login?t=${timestamp}`;
    
    // 모바일과 PC 모두에서 안전하게 작동하도록 해시 처리 개선
    // window.location.hash를 사용하여 해시 라우터 경로 직접 설정
    if (window.location.hash) {
      // 기존 해시가 있는 경우 해시만 변경
      window.location.hash = `#${loginPath}`;
    } else {
      // 해시가 없는 경우 전체 URL 설정
      window.location.href = window.location.origin + '/#' + loginPath;
    }
    
    // 5. 백그라운드에서 추가 정리 작업 (필요한 경우)
    // 이 시점에서는 이미 페이지 전환이 시작됨
    
    // 6. 하드 리디렉션 후에도 오버레이 유지 - 다른 페이지가 잠깐 보이는 것 방지
    // 일정 시간 후 로그아웃 상태 해제 (300ms 정도 충분히 기다림)
    setTimeout(() => {
      try {
        setLogoutState(false);
      } catch (e) {
        // 페이지가 이미 이동했을 수 있으므로 오류 무시
      }
    }, 300);
  } catch (error) {
    // 오류 발생 시 Fallback - 기존 방식 사용
    console.error('하드 리디렉션 실패, 일반 방식 사용:', error);
    
    try {
      // 일반 방식으로 리디렉션 시도
      const timestamp = new Date().getTime();
      navigate(`/auth/login?t=${timestamp}`);
    } catch (e) {
      // 모든 방법 실패 시 마지막 수단
      window.location.reload();
    }
    
    // 로그아웃 상태 종료
    setTimeout(() => {
      setLogoutState(false);
    }, 200);
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