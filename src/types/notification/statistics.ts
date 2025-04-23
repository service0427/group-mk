import { NotificationType, NotificationStatus } from './index';

// 알림 통계 집계 테이블 타입 정의
export interface INotificationAggregate {
  id: string;
  updated_at: Date | string;
  total_count: number;

  // 타입별 개수
  count_by_type: {
    [NotificationType.SYSTEM]: number;
    [NotificationType.TRANSACTION]: number;
    [NotificationType.SERVICE]: number;
    [NotificationType.SLOT]: number;
    [NotificationType.MARKETING]: number;
  };

  // 상태별 개수
  count_by_status: {
    [NotificationStatus.UNREAD]: number;
    [NotificationStatus.READ]: number;
    [NotificationStatus.ARCHIVED]: number;
  };

  // 회원 유형별 개수
  count_by_role: {
    developer: number;
    operator: number;
    distributor: number;
    agency: number;
    advertiser: number;
    [key: string]: number; // 기타 역할도 허용
  };
}

// 클라이언트에서 사용할 집계 상태
export interface NotificationAggregateState {
  isLoading: boolean;
  lastUpdated: Date | null;
  data: INotificationAggregate | null;
  error: Error | null;
}
