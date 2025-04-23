// 알림 타입 정의
export enum NotificationType {
  SYSTEM = 'system',           // 시스템 알림
  TRANSACTION = 'transaction', // 결제/캐시 관련 알림
  SERVICE = 'service',         // 서비스 알림
  SLOT = 'slot',               // 슬롯 상태 변경 알림
  MARKETING = 'marketing'      // 마케팅 알림
}

// 알림 중요도 정의
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// 알림 상태 정의
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

// 알림 인터페이스
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  icon?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date | string;
  expiresAt?: Date | string;
  actionTaken?: boolean;
}
