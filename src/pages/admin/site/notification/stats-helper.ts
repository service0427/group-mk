import { supabaseAdmin } from '@/supabase';
import { NotificationType, NotificationStatus } from '@/types/notification';
import { NotificationStats } from './services/notificationService';

// 전체 알림 기준 통계 조회 함수
export async function fetchAllNotificationStats(): Promise<NotificationStats> {
  try {
    // 타입별 통계
    const typeCount: Record<NotificationType, number> = {
      [NotificationType.SYSTEM]: 0,
      [NotificationType.TRANSACTION]: 0,
      [NotificationType.SERVICE]: 0,
      [NotificationType.SLOT]: 0,
      [NotificationType.MARKETING]: 0,
    };

    // 역할별 통계
    const roleCount: Record<string, number> = {
      'developer': 0,
      'operator': 0,
      'distributor': 0,
      'agency': 0,
      'advertiser': 0,
    };

    // 상태별 통계
    const statusCounts: Record<NotificationStatus, number> = {
      [NotificationStatus.UNREAD]: 0,
      [NotificationStatus.READ]: 0,
      [NotificationStatus.ARCHIVED]: 0
    };

    // 전체 알림 개수 조회
    const { count: totalCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    // 상태별 알림 개수 조회
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', NotificationStatus.UNREAD);

    const { count: readCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', NotificationStatus.READ);

    const { count: archivedCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', NotificationStatus.ARCHIVED);

    statusCounts[NotificationStatus.UNREAD] = unreadCount || 0;
    statusCounts[NotificationStatus.READ] = readCount || 0;
    statusCounts[NotificationStatus.ARCHIVED] = archivedCount || 0;

    // 타입별 알림 개수 조회
    for (const type of Object.keys(typeCount) as NotificationType[]) {
      const { count } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', type);

      typeCount[type] = count || 0;
    }

    // 역할별 알림 분포 조회 (샘플링 방식)
    const { data: sampleNotifications } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (sampleNotifications && sampleNotifications.length > 0) {
      // 고유 사용자 ID 추출
      const userIds = [...new Set(sampleNotifications.map(item => item.user_id))];

      // 사용자 정보 조회
      const { data: userRoles } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .in('id', userIds);

      if (userRoles && userRoles.length > 0) {
        // 사용자 ID -> 역할 매핑
        const userRoleMap: Record<string, string> = {};
        userRoles.forEach(user => {
          userRoleMap[user.id] = user.role;
        });

        // 역할별 알림 개수 집계
        sampleNotifications.forEach(notification => {
          const role = userRoleMap[notification.user_id];
          if (role && roleCount[role] !== undefined) {
            roleCount[role]++;
          }
        });
      }
    }

    return {
      total: totalCount || 0,
      byType: typeCount,
      byUserRole: roleCount,
      byStatus: statusCounts
    };

  } catch (error) {
    console.error('전체 알림 통계 조회 중 오류 발생:', error);
    // 오류 발생 시 빈 데이터 반환
    return {
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
        [NotificationStatus.ARCHIVED]: 0
      }
    };
  }
}