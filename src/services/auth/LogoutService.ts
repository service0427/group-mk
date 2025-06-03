import { supabase } from '@/supabase';
import { SafeHashNavigation } from '@/utils/safeHashNavigation';
import { NavigateFunction } from 'react-router-dom';

/**
 * 로그아웃 에러 타입 정의
 */
export enum LogoutErrorType {
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface LogoutError {
  type: LogoutErrorType;
  message: string;
  originalError?: any;
}

export interface LogoutResult {
  success: boolean;
  error?: LogoutError;
}

/**
 * 통합된 로그아웃 서비스
 * 모든 로그아웃 관련 로직을 한 곳에서 관리
 */
export class LogoutService {
  private static instance: LogoutService;
  private isProcessing = false;

  // 이벤트 리스너를 위한 타입
  private eventListeners: {
    start: Array<() => void>;
    complete: Array<(result: LogoutResult) => void>;
  } = {
      start: [],
      complete: []
    };

  private constructor() { }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): LogoutService {
    if (!LogoutService.instance) {
      LogoutService.instance = new LogoutService();
    }
    return LogoutService.instance;
  }

  /**
   * 메인 로그아웃 함수
   */
  async logout(navigate?: NavigateFunction): Promise<LogoutResult> {
    // 중복 실행 방지
    if (this.isProcessing) {
      // console.warn('[LogoutService] 이미 로그아웃 처리 중입니다');
      return {
        success: false,
        error: {
          type: LogoutErrorType.UNKNOWN_ERROR,
          message: '이미 로그아웃 처리 중입니다'
        }
      };
    }

    this.isProcessing = true;

    // 1. 로그아웃 시작 이벤트 발생
    this.emitLogoutStart();

    try {
      // 2. 로컬 인증 상태 정리 (실패해도 계속 진행)
      try {
        await this.clearAuthState();
      } catch (e) {
        // console.warn('[LogoutService] 로컬 상태 정리 실패:', e);
        // 계속 진행
      }

      // 3. Supabase 로그아웃 (중요)
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }

      } catch (e) {
        // Supabase 로그아웃 실패
        // Supabase 로그아웃 실패는 중요한 에러
        const result: LogoutResult = {
          success: false,
          error: {
            type: LogoutErrorType.SUPABASE_ERROR,
            message: '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.',
            originalError: e
          }
        };
        this.emitLogoutComplete(result);
        return result;
      }

      // 4. 라우팅 처리
      await this.redirectToLogin(navigate);

      // 5. 성공 결과 반환
      const result: LogoutResult = { success: true };
      this.emitLogoutComplete(result);

      return result;

    } catch (e) {
      // 예상치 못한 오류
      const result: LogoutResult = {
        success: false,
        error: {
          type: LogoutErrorType.UNKNOWN_ERROR,
          message: '알 수 없는 오류가 발생했습니다.',
          originalError: e
        }
      };
      this.emitLogoutComplete(result);
      return result;
    } finally {
      // 처리 완료 후 플래그 해제
      setTimeout(() => {
        this.isProcessing = false;
      }, 500);
    }
  }

  /**
   * 모든 인증 관련 스토리지 정리
   */
  private async clearAuthState(): Promise<void> {
    // localStorage 정리
    const localStorageKeys = [
      'auth',
      'currentUser',
      'lastAuthCheck',
      'auth_redirect',
      'logout_timestamp',
      'force_logout',
      'force_logout_timestamp',
      'force_logout_error'
    ];

    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // console.warn(`[LogoutService] localStorage.removeItem(${key}) 실패:`, e);
      }
    });

    // sessionStorage 정리
    const sessionStorageKeys = [
      'currentUser',
      'lastAuthCheck',
      'direct_to_login',
      'logout_complete',
      'logout_redirect',
      'logout_timestamp',
      'logout_error'
    ];

    sessionStorageKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        // console.warn(`[LogoutService] sessionStorage.removeItem(${key}) 실패:`, e);
      }
    });

    // 쿠키 정리
    try {
      document.cookie = "fallback_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "force_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (e) {
      // console.warn('[LogoutService] 쿠키 정리 실패:', e);
    }

    // Supabase 관련 스토리지 정리 (선택적)
    try {
      const supabaseKeyPattern = /^(sb-|supabase\.auth)/;

      // localStorage의 Supabase 키 정리
      Object.keys(localStorage)
        .filter(key => supabaseKeyPattern.test(key))
        .forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // console.warn(`[LogoutService] Supabase localStorage 정리 실패:`, e);
          }
        });

      // sessionStorage의 Supabase 키 정리
      Object.keys(sessionStorage)
        .filter(key => supabaseKeyPattern.test(key))
        .forEach(key => {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            // console.warn(`[LogoutService] Supabase sessionStorage 정리 실패:`, e);
          }
        });
    } catch (e) {
      // console.warn('[LogoutService] Supabase 스토리지 정리 중 오류:', e);
    }
  }

  /**
   * 로그인 페이지로 리다이렉트
   */
  private async redirectToLogin(navigate?: NavigateFunction): Promise<void> {
    // SafeHashNavigation 사용하여 안전하게 이동
    await SafeHashNavigation.navigateToLogin(navigate, {
      forceHardRedirect: false, // 먼저 React Router 시도
      withTransition: true
    });
  }

  /**
   * 로그아웃 시작 이벤트 발생
   */
  private emitLogoutStart(): void {
    this.eventListeners.start.forEach(listener => {
      try {
        listener();
      } catch (e) {
        // 로그아웃 시작 이벤트 리스너 오류
      }
    });
  }

  /**
   * 로그아웃 완료 이벤트 발생
   */
  private emitLogoutComplete(result: LogoutResult): void {
    this.eventListeners.complete.forEach(listener => {
      try {
        listener(result);
      } catch (e) {
        // 로그아웃 완료 이벤트 리스너 오류
      }
    });
  }

  /**
   * 로그아웃 시작 이벤트 리스너 등록
   */
  onLogoutStart(listener: () => void): () => void {
    this.eventListeners.start.push(listener);

    // 리스너 제거 함수 반환
    return () => {
      const index = this.eventListeners.start.indexOf(listener);
      if (index > -1) {
        this.eventListeners.start.splice(index, 1);
      }
    };
  }

  /**
   * 로그아웃 완료 이벤트 리스너 등록
   */
  onLogoutComplete(listener: (result: LogoutResult) => void): () => void {
    this.eventListeners.complete.push(listener);

    // 리스너 제거 함수 반환
    return () => {
      const index = this.eventListeners.complete.indexOf(listener);
      if (index > -1) {
        this.eventListeners.complete.splice(index, 1);
      }
    };
  }

  /**
   * 로그아웃 처리 중인지 확인
   */
  isLoggingOut(): boolean {
    return this.isProcessing;
  }
}