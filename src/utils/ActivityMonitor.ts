/**
 * 최적화된 사용자 활동 모니터링 클래스
 * 30분 비활성 시 자동 로그아웃을 위한 활동 감지
 * 모바일 환경 지원을 위한 Page Visibility API 통합
 */
export class ActivityMonitor {
  private lastActivity: number = Date.now();
  private activityTimer?: number;
  private checkInterval?: number;
  private timeoutMinutes: number;
  private readonly CHECK_INTERVAL = 60 * 1000; // 1분마다 체크
  private readonly DEBOUNCE_DELAY = 1000; // 1초 디바운스
  private readonly STORAGE_KEY = 'lastUserActivity'; // localStorage 키
  private isActive = false;
  private eventHandlers: Map<string, EventListener> = new Map();
  private currentTimeoutCallback?: () => void;
  
  // 백그라운드 시간 추적을 위한 변수
  private wentBackgroundAt: number | null = null;
  private totalBackgroundTime: number = 0;
  private visibilityHandler?: () => void;
  private storageHandler?: (e: StorageEvent) => void;
  private hasWarnedUser: boolean = false;

  constructor(timeoutMinutes: number = 30) {
    this.timeoutMinutes = timeoutMinutes;
  }

  /**
   * 활동 모니터링 시작
   */
  start(onTimeout: () => void): void {
    if (this.isActive) {
      // 이미 모니터링 중입니다
      return;
    }

    this.currentTimeoutCallback = onTimeout;
    this.isActive = true;
    this.lastActivity = Date.now();

    const timeoutMs = this.timeoutMinutes * 60 * 1000;

    // 중요한 이벤트만 감지 (성능 최적화)
    const criticalEvents = ['mousedown', 'keydown', 'touchstart'];

    // 디바운스된 활동 핸들러
    const handleActivity = this.debounce(() => {
      this.recordActivity();
    }, this.DEBOUNCE_DELAY);

    // 이벤트 리스너 등록
    criticalEvents.forEach(event => {
      this.eventHandlers.set(event, handleActivity);
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Page Visibility API 핸들러 설정
    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);
    
    // Storage 이벤트 핸들러 설정 (크로스 탭 동기화)
    this.storageHandler = (e: StorageEvent) => this.handleStorageChange(e);
    window.addEventListener('storage', this.storageHandler);
    
    // 초기 활동 시간을 localStorage에 저장
    this.updateActivityTime();

    // 주기적으로 타임아웃 체크 (이벤트 리스너 대신 인터벌 사용)
    this.checkInterval = window.setInterval(() => {
      this.checkTimeout();
    }, this.CHECK_INTERVAL);
  }

  /**
   * 활동 모니터링 중지
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    // 타이머 정리
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = undefined;
    }

    // 이벤트 리스너 제거
    this.eventHandlers.forEach((handler, event) => {
      window.removeEventListener(event, handler);
    });
    this.eventHandlers.clear();
    
    // Page Visibility 핸들러 제거
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
    
    // Storage 핸들러 제거
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = undefined;
    }
    
    // localStorage에서 활동 시간 제거
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      // localStorage 오류 무시
    }
  }

  /**
   * 활동 타이머 리셋 (수동으로 활동 기록)
   */
  recordActivity(): void {
    if (!this.isActive) {
      return;
    }

    this.lastActivity = Date.now();
    this.hasWarnedUser = false; // 경고 상태 리셋
    this.updateActivityTime();
  }
  
  /**
   * localStorage에 활동 시간 업데이트
   */
  private updateActivityTime(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.lastActivity.toString());
    } catch (e) {
      // localStorage 오류 무시
    }
  }

  /**
   * 남은 시간 가져오기 (밀리초)
   */
  getRemainingTime(): number {
    if (!this.isActive) {
      return 0;
    }

    const now = Date.now();
    const totalInactiveTime = this.calculateTotalInactiveTime(now);
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - totalInactiveTime);
  }
  
  /**
   * 전체 비활성 시간 계산 (백그라운드 시간 포함)
   */
  private calculateTotalInactiveTime(currentTime: number): number {
    // 현재 백그라운드 상태인 경우
    if (this.wentBackgroundAt !== null) {
      // 마지막 활동부터 백그라운드 진입까지의 시간
      const inactiveBeforeBackground = this.wentBackgroundAt - this.lastActivity;
      // 백그라운드에 있는 시간
      const currentBackgroundTime = currentTime - this.wentBackgroundAt;
      // 전체 비활성 시간 = 백그라운드 진입 전 비활성 시간 + 현재 백그라운드 시간 + 이전 누적 백그라운드 시간
      return inactiveBeforeBackground + currentBackgroundTime + this.totalBackgroundTime;
    } else {
      // 포그라운드 상태인 경우
      // 전체 비활성 시간 = 현재 시간 - 마지막 활동 시간 + 누적 백그라운드 시간
      return (currentTime - this.lastActivity) + this.totalBackgroundTime;
    }
  }

  /**
   * 모니터링 중인지 확인
   */
  isMonitoring(): boolean {
    return this.isActive;
  }

  /**
   * 효율적인 디바운스 구현
   */
  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): T {
    let timeout: number | undefined;

    return ((...args: Parameters<T>) => {
      const later = () => {
        timeout = undefined;
        func(...args);
      };

      if (timeout !== undefined) {
        clearTimeout(timeout);
      }

      timeout = window.setTimeout(later, wait);
    }) as T;
  }

  /**
   * 타임아웃 설정 변경
   */
  setTimeoutMinutes(minutes: number): void {
    const wasActive = this.isActive;
    const onTimeout = this.currentTimeoutCallback;

    this.timeoutMinutes = minutes;

    if (wasActive && onTimeout) {
      this.stop();
      this.start(onTimeout);
    }
  }

  /**
   * 현재 타임아웃 분 가져오기
   */
  getTimeoutMinutes(): number {
    return this.timeoutMinutes;
  }
  
  /**
   * 타임아웃 체크
   */
  private checkTimeout(): void {
    if (!this.isActive || !this.currentTimeoutCallback) {
      return;
    }
    
    const now = Date.now();
    const totalInactiveTime = this.calculateTotalInactiveTime(now);
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    const remainingTime = timeoutMs - totalInactiveTime;
    
    if (remainingTime <= 0) {
      // 타임아웃 도달
      this.currentTimeoutCallback();
      this.stop();
    } else if (remainingTime <= 5 * 60 * 1000 && !this.hasWarnedUser) {
      // 5분 미만 남았을 때 한 번만 경고
      this.hasWarnedUser = true;
    }
  }
  
  /**
   * Page Visibility 변경 핸들러
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // 백그라운드로 전환
      this.wentBackgroundAt = Date.now();
    } else if (document.visibilityState === 'visible') {
      // 포그라운드로 복귀
      if (this.wentBackgroundAt !== null) {
        const backgroundDuration = Date.now() - this.wentBackgroundAt;
        this.totalBackgroundTime += backgroundDuration;
        
        this.wentBackgroundAt = null;
        
        // 즉시 타임아웃 체크
        this.checkTimeout();
      }
    }
  }
  
  /**
   * Storage 변경 핸들러 (다른 탭에서의 활동 감지)
   */
  private handleStorageChange(e: StorageEvent): void {
    if (e.key === this.STORAGE_KEY && e.newValue) {
      try {
        const otherTabActivity = parseInt(e.newValue);
        if (!isNaN(otherTabActivity) && otherTabActivity > this.lastActivity) {
          this.lastActivity = otherTabActivity;
          this.hasWarnedUser = false;
          
          // 백그라운드 시간 리셋 (다른 탭에서 활동이 있었으므로)
          this.totalBackgroundTime = 0;
          this.wentBackgroundAt = null;
        }
      } catch (e) {
        // 파싱 오류 무시
      }
    }
  }
}

// 전역 인스턴스 (선택적)
export const globalActivityMonitor = new ActivityMonitor();