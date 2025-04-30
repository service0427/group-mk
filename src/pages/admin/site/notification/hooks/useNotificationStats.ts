import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { backgroundTaskManager } from '@/utils/backgroundTasks';
import { NotificationStats } from '../services/notificationService';
import { INotificationAggregate } from '@/types/notification/statistics';
// 상대 경로 사용으로 변경
import {
  fetchNotificationAggregate,
  refreshNotificationAggregate,
  initializeAggregateTable
} from '../services/notificationAggregateService';
import { NotificationType, NotificationStatus } from '@/types/notification';

// 집계 테이블 데이터를 NotificationStats 형식으로 변환
const convertAggregateToStats = (aggregate: INotificationAggregate): NotificationStats => {
  return {
    total: aggregate.total_count,
    byType: {
      [NotificationType.SYSTEM]: aggregate.count_by_type[NotificationType.SYSTEM],
      [NotificationType.TRANSACTION]: aggregate.count_by_type[NotificationType.TRANSACTION],
      [NotificationType.SERVICE]: aggregate.count_by_type[NotificationType.SERVICE],
      [NotificationType.SLOT]: aggregate.count_by_type[NotificationType.SLOT],
      [NotificationType.MARKETING]: aggregate.count_by_type[NotificationType.MARKETING],
    },
    byUserRole: aggregate.count_by_role,
    byStatus: {
      [NotificationStatus.UNREAD]: aggregate.count_by_status[NotificationStatus.UNREAD],
      [NotificationStatus.READ]: aggregate.count_by_status[NotificationStatus.READ],
      [NotificationStatus.ARCHIVED]: aggregate.count_by_status[NotificationStatus.ARCHIVED],
    }
  };
};

// 기본 통계 객체 생성
const createDefaultStats = (): NotificationStats => ({
  total: 0,
  byType: {
    [NotificationType.SYSTEM]: 0,
    [NotificationType.TRANSACTION]: 0,
    [NotificationType.SERVICE]: 0,
    [NotificationType.SLOT]: 0,
    [NotificationType.MARKETING]: 0,
  },
  byUserRole: {
    'developer': 0,
    'operator': 0,
    'distributor': 0,
    'agency': 0,
    'advertiser': 0,
  },
  byStatus: {
    [NotificationStatus.UNREAD]: 0,
    [NotificationStatus.READ]: 0,
    [NotificationStatus.ARCHIVED]: 0,
  }
});

// 알림 통계 관리 훅
export const useNotificationStats = (options: {
  refreshInterval?: number;
  autoRefresh?: boolean;
  fallbackToOldMethod?: boolean; // 기존 방식으로 폴백할지 여부
} = {}) => {
  const [stats, setStats] = useState<NotificationStats>(createDefaultStats());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [useFallback, setUseFallback] = useState(false); // 폴백 사용 여부

  const {
    refreshInterval = 60000, // 기본 1분마다 갱신
    autoRefresh = true,
    fallbackToOldMethod = true // 기본값은 폴백 사용
  } = options;

  // 통계 데이터 로드
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (useFallback) {
        // 폴백 모드를 사용 중인 경우 기존 방식으로 데이터 로드
        await loadStatsFallback();
        return;
      }

      try {
        // 집계 테이블이 초기화되었는지 확인
        const initialized = await initializeAggregateTable();

        if (!initialized) {
          throw new Error('집계 테이블 초기화 실패');
        }

        // 집계 데이터 조회
        const aggregateData = await fetchNotificationAggregate();

        if (aggregateData) {
          // 통계 데이터 변환 및 설정
          const convertedStats = convertAggregateToStats(aggregateData);
          setStats(convertedStats);
          setLastUpdated(new Date(aggregateData.updated_at));
        } else {
          // 집계 데이터가 없는 경우 전체 갱신 시도
          await refreshNotificationAggregate();
          const refreshedData = await fetchNotificationAggregate();

          if (refreshedData) {
            const convertedStats = convertAggregateToStats(refreshedData);
            setStats(convertedStats);
            setLastUpdated(new Date(refreshedData.updated_at));
          } else {
            throw new Error('통계 데이터 로드 및 갱신 실패');
          }
        }
      } catch (error: any) {
        console.error('집계 테이블 방식 실패, 폴백 모드로 전환:', error);

        if (fallbackToOldMethod) {
          setUseFallback(true);
          await loadStatsFallback();
        } else {
          throw error;
        }
      }
    } catch (e: any) {
      console.error('알림 통계 로드 중 오류 발생:', e);
      setError(new Error(e.message || '알림 통계를 불러오는데 실패했습니다'));

      // 기본값으로 설정
      setStats(createDefaultStats());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [fallbackToOldMethod, useFallback]);

  // 기존 방식을 사용한 통계 데이터 로드 (폴백)
  const loadStatsFallback = useCallback(async () => {
    try {
      // 상대 경로로 변경
      const notificationService = await import('../services/notificationService');
      const { fetchNotifications, calculateStats } = notificationService;

      // 오류 발생해도 기본값으로 표시할 준비
      let fallbackStats = createDefaultStats();

      try {
        const result = await fetchNotifications({
          page: 1,
          itemsPerPage: 100, // 통계를 위한 대표 샘플
          filterType: 'all',
          filterUserRole: 'all'
        });

        if (result && result.data) {
          const oldStats = await calculateStats(
            result.data,
            result.totalCount,
            result.statusCounts
          );

          fallbackStats = oldStats;
        }
      } catch (loadError) {
        console.error('데이터 로드 중 오류:', loadError);
      }

      setStats(fallbackStats);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error('폴백 방식 통계 로드 중 오류 발생:', e);
      setError(new Error(e.message || '알림 통계를 불러오는데 실패했습니다'));
      setStats(createDefaultStats());
      setLastUpdated(new Date());
    }
  }, []);

  // 통계 데이터 강제 갱신
  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (useFallback) {
        // 폴백 모드 사용 중인 경우 기존 방식으로 갱신
        await loadStatsFallback();
        toast.success('알림 통계가 갱신되었습니다');
        return true;
      }

      try {
        // 전체 통계 재계산 요청
        const refreshSuccess = await refreshNotificationAggregate();

        if (!refreshSuccess) {
          throw new Error('통계 갱신 실패');
        }

        // 갱신된 데이터 로드
        const refreshedData = await fetchNotificationAggregate();

        if (refreshedData) {
          const convertedStats = convertAggregateToStats(refreshedData);
          setStats(convertedStats);
          setLastUpdated(new Date(refreshedData.updated_at));
          return true;
        } else {
          throw new Error('갱신된 통계 데이터 로드 실패');
        }
      } catch (error: any) {
        console.error('집계 테이블 방식 갱신 실패, 폴백 모드로 전환:', error);

        if (fallbackToOldMethod) {
          setUseFallback(true);
          await loadStatsFallback();
          toast.success('알림 통계가 갱신되었습니다 (기본 방식)');
          return true;
        } else {
          throw error;
        }
      }
    } catch (e: any) {
      console.error('알림 통계 갱신 중 오류 발생:', e);
      setError(new Error(e.message || '알림 통계를 갱신하는데 실패했습니다'));

      // 오류 발생해도 최소한의 표시를 위해 기본값 적용
      setStats(createDefaultStats());
      setLastUpdated(new Date());
      toast.error('알림 통계 갱신 중 오류가 발생했습니다');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fallbackToOldMethod, useFallback, loadStatsFallback]);

  // 백그라운드 작업 설정
  useEffect(() => {
    if (autoRefresh) {
      // 폴백 모드일 경우 또는 아닐 경우 적절한 백그라운드 작업 등록
      const taskId = 'notification-stats-refresh';

      // 이전 작업이 있으면 제거
      backgroundTaskManager.stopTask(taskId);
      backgroundTaskManager.unregisterTask(taskId);

      // 주기적 통계 갱신 작업 등록
      const statsRefreshTask = {
        id: taskId,
        interval: refreshInterval,
        task: async () => {
          try {
            if (useFallback) {
              // 폴백 모드에서는 기존 방식으로 갱신
              await loadStatsFallback();
            } else {
              // 집계 테이블 방식 사용 시도
              try {
                // 정적 import로 변경
                const aggregateData = await fetchNotificationAggregate();

                if (aggregateData) {
                  // 마지막 업데이트 시간을 확인하여 필요한 경우만 상태 업데이트
                  const updatedTime = new Date(aggregateData.updated_at);
                  if (!lastUpdated || updatedTime.getTime() > lastUpdated.getTime()) {
                    const convertedStats = convertAggregateToStats(aggregateData);
                    setStats(convertedStats);
                    setLastUpdated(updatedTime);
                  }
                } else if (fallbackToOldMethod) {
                  // 집계 데이터가 없으면 폴백으로 전환
                  setUseFallback(true);
                  await loadStatsFallback();
                }
              } catch (tableError) {
                // 테이블 접근 오류 발생 시
                console.error('통계 테이블 접근 중 오류 발생:', tableError);

                if (fallbackToOldMethod && !useFallback) {
                  setUseFallback(true);
                  await loadStatsFallback();
                }
              }
            }
          } catch (e) {
            // 최상위 try-catch로 모든 예외 처리
            console.error('백그라운드 작업 실행 중 예외 발생:', e);

            if (fallbackToOldMethod && !useFallback) {
              setUseFallback(true);
              try {
                await loadStatsFallback();
              } catch (fallbackError) {
                console.error('폴백 시도 중 추가 오류:', fallbackError);
              }
            }
          }
        },
        runImmediately: false
      };

      // 백그라운드 작업 등록 및 시작
      backgroundTaskManager.registerTask(statsRefreshTask);
      backgroundTaskManager.startTask(taskId);

      // 컴포넌트 언마운트 시 작업 정리
      return () => {
        backgroundTaskManager.stopTask(taskId);
        backgroundTaskManager.unregisterTask(taskId);
      };
    }
  }, [autoRefresh, refreshInterval, lastUpdated, useFallback, fallbackToOldMethod, loadStatsFallback]);

  // 초기 데이터 로드
  useEffect(() => {
    loadStats();

    // 페이지 로드 시 테이블이 생성된 직후라면 자동으로 통계 초기화 시도
    // 지연 실행하여 다른 초기화 작업 완료 후 실행
    setTimeout(async () => {
      try {
        // 통계 테이블 존재 여부 확인 후 없으면 폴백 모드 유지
        const initialized = await initializeAggregateTable();

        if (initialized && !useFallback) {
          // 테이블이 있고 폴백 모드가 아니면 통계 갱신
          await refreshNotificationAggregate();
          await loadStats(); // 갱신된 데이터 다시 로드
        }
      } catch (e) {
        console.error('초기 테이블 확인 중 오류:', e);
      }
    }, 2000);
  }, [loadStats, useFallback]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refreshStats,
    useFallback // 폴백 모드 사용 중인지 여부도 반환
  };
};
