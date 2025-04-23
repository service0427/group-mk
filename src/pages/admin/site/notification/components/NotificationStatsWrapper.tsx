import React from 'react';
import NotificationStatsCard from './NotificationStatsCard';
import { NotificationStats } from '../services/notificationService';
import { NotificationType, NotificationStatus } from '@/types/notification';

interface NotificationStatsWrapperProps {
  stats: NotificationStats;
  lastUpdated?: Date | null;
  useFallback?: boolean;
}

const NotificationStatsWrapper: React.FC<NotificationStatsWrapperProps> = ({
  stats,
  lastUpdated,
  useFallback = false
}) => {
  // 알림 타입 표시 텍스트
  const getNotificationTypeText = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return '시스템';
      case NotificationType.TRANSACTION:
        return '결제/캐시';
      case NotificationType.SERVICE:
        return '서비스';
      case NotificationType.SLOT:
        return '슬롯';
      case NotificationType.MARKETING:
        return '마케팅';
      default:
        return '기타';
    }
  };

  // 안전한 데이터 접근을 위한 유틸리티 함수
  const safeGetStatusCount = (status: NotificationStatus) => {
    try {
      return stats.byStatus[status] || 0;
    } catch (e) {
      return 0;
    }
  };

  const safeGetTypeCount = (type: NotificationType) => {
    try {
      return stats.byType[type] || 0;
    } catch (e) {
      return 0;
    }
  };

  const safeGetRoleCount = (role: string) => {
    try {
      return stats.byUserRole[role] || 0;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      <NotificationStatsCard
        title={`알림 개수 정보 (전체 알림)${useFallback ? ' - 기본 모드' : ''}`}
        data={[
          { label: '전체', value: stats.total || 0 },
          { label: '읽지 않음', value: safeGetStatusCount(NotificationStatus.UNREAD) },
          { label: '읽음', value: safeGetStatusCount(NotificationStatus.READ) },
          { label: '보관됨', value: safeGetStatusCount(NotificationStatus.ARCHIVED) }
        ]}
        icon="notification"
      />
      <NotificationStatsCard
        title={`알림 타입별 분포 (전체 알림)${useFallback ? ' - 기본 모드' : ''}`}
        data={Object.values(NotificationType).map(type => ({
          label: getNotificationTypeText(type),
          value: safeGetTypeCount(type)
        }))}
        icon="abstract-28"
      />
      <NotificationStatsCard
        title={`회원 유형별 분포 (전체 알림)${useFallback ? ' - 기본 모드' : ''}`}
        data={[
          { label: '개발자', value: safeGetRoleCount('developer') },
          { label: '운영자', value: safeGetRoleCount('operator') },
          { label: '총판', value: safeGetRoleCount('distributor') },
          { label: '대행사', value: safeGetRoleCount('agency') },
          { label: '광고주', value: safeGetRoleCount('advertiser') }
        ]}
        icon="briefcase"
      />
    </div>
  );
};

export default NotificationStatsWrapper;