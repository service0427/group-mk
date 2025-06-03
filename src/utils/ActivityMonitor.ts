/**
 * 최적화된 사용자 활동 모니터링 클래스
 * 30분 비활성 시 자동 로그아웃을 위한 활동 감지
 */
export class ActivityMonitor {
  private lastActivity: number = Date.now();
  private activityTimer?: number;
  private checkInterval?: number;
  private timeoutMinutes: number;
  private readonly CHECK_INTERVAL = 60 * 1000; // 1분마다 체크
  private readonly DEBOUNCE_DELAY = 1000; // 1초 디바운스
  private isActive = false;
  private eventHandlers: Map<string, EventListener> = new Map();
  private currentTimeoutCallback?: () => void;

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
      this.lastActivity = Date.now();
    }, this.DEBOUNCE_DELAY);

    // 이벤트 리스너 등록
    criticalEvents.forEach(event => {
      this.eventHandlers.set(event, handleActivity);
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 주기적으로 타임아웃 체크 (이벤트 리스너 대신 인터벌 사용)
    this.checkInterval = window.setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      const remainingTime = timeoutMs - inactiveTime;

      if (remainingTime <= 0) {
        // Inactivity timeout reached
        onTimeout();
        this.stop();
      } else if (remainingTime <= 5 * 60 * 1000 && remainingTime > 4 * 60 * 1000) {
        // 5분 미만 남았을 때 한 번만 경고
        // 자동 로그아웃까지 X분 남음
      }
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
  }

  /**
   * 활동 타이머 리셋 (수동으로 활동 기록)
   */
  recordActivity(): void {
    if (!this.isActive) {
      return;
    }

    this.lastActivity = Date.now();
  }

  /**
   * 남은 시간 가져오기 (밀리초)
   */
  getRemainingTime(): number {
    if (!this.isActive) {
      return 0;
    }

    const inactiveTime = Date.now() - this.lastActivity;
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - inactiveTime);
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
}

// 전역 인스턴스 (선택적)
export const globalActivityMonitor = new ActivityMonitor();