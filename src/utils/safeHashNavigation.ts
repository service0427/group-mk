import { NavigateFunction } from 'react-router-dom';

/**
 * HashRouter에서 안전한 네비게이션을 제공하는 유틸리티 클래스
 * React Router navigate 실패 시 자동으로 하드 리디렉션 폴백
 */
export class SafeHashNavigation {
  private static isNavigating = false;
  
  /**
   * HashRouter에서 안전하게 네비게이션하는 함수
   * React Router navigate 실패 시 자동으로 하드 리디렉션 폴백
   */
  static async navigateToLogin(
    navigate?: NavigateFunction,
    options?: { 
      forceHardRedirect?: boolean;
      withTransition?: boolean;
    }
  ): Promise<void> {
    const { forceHardRedirect = false, withTransition = true } = options || {};
    
    // 중복 네비게이션 방지
    if (this.isNavigating) {
      // console.warn('[SafeHashNavigation] 이미 네비게이션 중입니다');
      return;
    }
    
    this.isNavigating = true;
    
    try {
      // 1. 우선 React Router 시도 (하드 리디렉션이 아닌 경우)
      if (!forceHardRedirect && navigate) {
        try {
          // 해시 경로 확인
          const targetPath = '/auth/login';
          
          // navigate 전에 현재 경로 확인
          const currentHash = window.location.hash;
          
          // 이미 로그인 페이지면 스킵
          if (currentHash.includes('/auth/login')) {
            // console.log('[SafeHashNavigation] 이미 로그인 페이지입니다');
            return;
          }
          
          // React Router navigate 시도
          await navigate(targetPath, { replace: true });
          
          // navigate 후 실제로 이동했는지 확인 (100ms 대기)
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const newHash = window.location.hash;
          if (newHash.includes('/auth/login')) {
            // 성공적으로 이동됨
            // console.log('[SafeHashNavigation] React Router navigate 성공');
            return;
          }
          
          // 실패한 경우 폴백으로 진행
          // console.warn('[SafeHashNavigation] React Router navigate 실패, 하드 리디렉션 사용');
        } catch (error) {
          // console.error('[SafeHashNavigation] Navigate 오류:', error);
        }
      }
      
      // 2. 하드 리디렉션 폴백
      this.performHardRedirect();
      
    } finally {
      // 300ms 후 플래그 해제
      setTimeout(() => {
        this.isNavigating = false;
      }, 300);
    }
  }
  
  /**
   * 안전한 하드 리디렉션
   */
  private static performHardRedirect(): void {
    const timestamp = Date.now();
    const loginPath = `/auth/login?t=${timestamp}`;
    
    // 해시 라우터용 URL 생성
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}#${loginPath}`;
    
    // console.log('[SafeHashNavigation] 하드 리디렉션:', fullUrl);
    
    // 즉시 이동
    window.location.href = fullUrl;
  }
  
  /**
   * 현재 해시 경로 가져오기
   */
  static getCurrentHashPath(): string {
    return window.location.hash.slice(1) || '/';
  }
  
  /**
   * 해시 경로 변경 감지
   */
  static onHashChange(callback: (path: string) => void): () => void {
    const handler = () => {
      callback(this.getCurrentHashPath());
    };
    
    window.addEventListener('hashchange', handler);
    
    return () => {
      window.removeEventListener('hashchange', handler);
    };
  }
  
  /**
   * 경로가 유효한지 확인
   */
  static isValidRoute(path: string, validRoutes: string[]): boolean {
    return validRoutes.some(route => {
      // 와일드카드 처리
      if (route.endsWith('*')) {
        const routePrefix = route.slice(0, -1);
        return path.startsWith(routePrefix);
      }
      return path === route || path.startsWith(route + '/');
    });
  }
}