import { toast } from 'sonner';

type Task = () => Promise<void>;
type TaskConfig = {
  id: string;
  interval: number; // 밀리초 단위
  task: Task;
  runImmediately?: boolean;
};

/**
 * 백그라운드 작업 관리자
 * 웹 애플리케이션에서 주기적으로 실행되어야 하는 작업을 관리합니다.
 */
class BackgroundTaskManager {
  private tasks: Map<string, { config: TaskConfig; timerId?: number }> = new Map();
  private isActive: boolean = false;
  private startTime: Date = new Date();

  constructor() {
    // 페이지 가시성 변경 이벤트 리스너 등록
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  /**
   * 페이지 가시성 변경 처리
   * 페이지가 보이지 않을 때는 작업을 일시 중지합니다.
   */
  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.resumeAllTasks();
    } else {
      this.pauseAllTasks();
    }
  };

  /**
   * 페이지 언로드 처리
   * 페이지가 닫힐 때 모든 작업을 중지합니다.
   */
  private handleBeforeUnload = () => {
    this.stopAllTasks();
  };

  /**
   * 새 백그라운드 작업 등록
   */
  public registerTask(config: TaskConfig): boolean {
    try {
      if (this.tasks.has(config.id)) {
        return false;
      }

      this.tasks.set(config.id, { config });

      // 즉시 실행 옵션이 있고 관리자가 활성화 상태인 경우 즉시 시작
      if (config.runImmediately && this.isActive) {
        this.startTask(config.id);
      }

      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 등록된 작업 제거
   */
  public unregisterTask(taskId: string): boolean {
    try {
      if (!this.tasks.has(taskId)) {
        return false;
      }

      const task = this.tasks.get(taskId);
      if (task?.timerId) {
        clearInterval(task.timerId);
      }

      this.tasks.delete(taskId);
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 등록된 작업 시작
   */
  public startTask(taskId: string): boolean {
    try {
      const taskEntry = this.tasks.get(taskId);
      if (!taskEntry) {
        return false;
      }

      // 이미 실행 중인 작업 중지
      if (taskEntry.timerId) {
        clearInterval(taskEntry.timerId);
      }

      const { config } = taskEntry;

      // 작업 초기 실행
      this.executeTask(config.task, taskId);

      // 주기적 실행 설정
      const timerId = window.setInterval(() => {
        this.executeTask(config.task, taskId);
      }, config.interval);

      // 작업 상태 업데이트
      this.tasks.set(taskId, { ...taskEntry, timerId: timerId as unknown as number });

      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 작업 실행 래퍼
   * 오류 처리 및 로깅 포함
   */
  private async executeTask(task: Task, taskId: string): Promise<void> {
    try {
      await task();
    } catch (error) {
      
    }
  }

  /**
   * 등록된 작업 중지
   */
  public stopTask(taskId: string): boolean {
    try {
      const taskEntry = this.tasks.get(taskId);
      if (!taskEntry) {
        return false;
      }

      // 실행 중인 작업 중지
      if (taskEntry.timerId) {
        clearInterval(taskEntry.timerId);
        this.tasks.set(taskId, { ...taskEntry, timerId: undefined });
      }

      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 모든 등록된 작업 시작
   */
  public startAllTasks(): boolean {
    try {
      this.isActive = true;
      this.startTime = new Date();

      let successCount = 0;
      this.tasks.forEach((_, taskId) => {
        if (this.startTask(taskId)) {
          successCount++;
        }
      });

      return successCount > 0;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 모든 등록된 작업 일시 중지
   */
  public pauseAllTasks(): boolean {
    try {
      this.isActive = false;

      let successCount = 0;
      this.tasks.forEach((taskEntry, taskId) => {
        if (taskEntry.timerId) {
          clearInterval(taskEntry.timerId);
          this.tasks.set(taskId, { ...taskEntry, timerId: undefined });
          successCount++;
        }
      });

      return successCount > 0;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 모든 일시 중지된 작업 재개
   */
  public resumeAllTasks(): boolean {
    try {
      if (this.isActive) return true; // 이미 활성 상태

      this.isActive = true;

      let successCount = 0;
      this.tasks.forEach((_, taskId) => {
        if (this.startTask(taskId)) {
          successCount++;
        }
      });

      return successCount > 0;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 모든 등록된 작업 중지
   */
  public stopAllTasks(): boolean {
    try {
      this.isActive = false;

      let successCount = 0;
      this.tasks.forEach((taskEntry, taskId) => {
        if (taskEntry.timerId) {
          clearInterval(taskEntry.timerId);
          this.tasks.set(taskId, { ...taskEntry, timerId: undefined });
          successCount++;
        }
      });

      return successCount > 0;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * 백그라운드 작업 관리자 상태 확인
   */
  public getStatus(): {
    isActive: boolean;
    taskCount: number;
    runningTaskCount: number;
    startTime: Date;
    uptime: number;
  } {
    let runningTaskCount = 0;
    this.tasks.forEach((taskEntry) => {
      if (taskEntry.timerId) {
        runningTaskCount++;
      }
    });

    const uptime = Date.now() - this.startTime.getTime();

    return {
      isActive: this.isActive,
      taskCount: this.tasks.size,
      runningTaskCount,
      startTime: this.startTime,
      uptime,
    };
  }

  /**
   * 지정된 작업 즉시 실행
   */
  public executeTaskNow(taskId: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        const taskEntry = this.tasks.get(taskId);
        if (!taskEntry) {
          resolve(false);
          return;
        }

        const { config } = taskEntry;
        toast.loading(`백그라운드 작업 실행 중: ${config.id}`);

        await this.executeTask(config.task, taskId);

        toast.dismiss();
        toast.success(`백그라운드 작업이 실행되었습니다: ${config.id}`);
        resolve(true);
      } catch (error) {
        
        toast.dismiss();
        toast.error(`작업 실행 중 오류가 발생했습니다: ${taskId}`);
        resolve(false);
      }
    });
  }
}

// 싱글톤 인스턴스 생성
export const backgroundTaskManager = new BackgroundTaskManager();

export default backgroundTaskManager;
