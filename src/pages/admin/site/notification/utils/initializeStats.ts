// 알림 통계 테이블 초기화 유틸리티
import { supabaseAdmin } from '@/supabase';
import { toast } from 'sonner';
import { NotificationType, NotificationStatus } from '@/types/notification';
import { INotificationAggregate } from '@/types/notification/statistics';

// 기본 집계 객체 생성 함수
export const createDefaultAggregate = (): Omit<INotificationAggregate, 'id' | 'updated_at'> => ({
  total_count: 0,
  count_by_type: {
    [NotificationType.SYSTEM]: 0,
    [NotificationType.TRANSACTION]: 0,
    [NotificationType.SERVICE]: 0,
    [NotificationType.SLOT]: 0,
    [NotificationType.MARKETING]: 0,
  },
  count_by_status: {
    [NotificationStatus.UNREAD]: 0,
    [NotificationStatus.READ]: 0,
    [NotificationStatus.ARCHIVED]: 0,
  },
  count_by_role: {
    developer: 0,
    operator: 0,
    distributor: 0,
    agency: 0,
    advertiser: 0,
  }
});

/**
 * 알림 통계 테이블 검증
 */
export const validateAggregateTable = async (): Promise<boolean> => {
  try {
    // 테이블 존재 여부 확인
    const { data, error } = await supabaseAdmin
      .from('notification_aggregates')
      .select('id')
      .limit(1);

    if (error) {
      
      toast.error('통계 테이블 검증 실패: ' + error.message);
      return false;
    }

    
    toast.success('통계 테이블이 정상적으로 존재합니다');
    return true;
  } catch (error: any) {
    
    toast.error('통계 테이블 검증 중 예외 발생');
    return false;
  }
};

/**
 * 알림 통계 전체 갱신
 */
export const refreshStats = async (): Promise<boolean> => {
  try {
    toast.loading('알림 통계 집계 중...');
    

    // 초기 집계 객체 생성
    const aggregate = createDefaultAggregate();

    // 1. 전체 알림 개수 조회
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      
      toast.dismiss();
      toast.error('알림 통계 집계 중 오류가 발생했습니다.');
      return false;
    }

    aggregate.total_count = totalCount || 0;

    // 2. 타입별 알림 개수 조회
    const typePromises = Object.values(NotificationType).map(async (type) => {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', type);

      if (error) {
        
        return { type, count: 0 };
      }

      return { type, count: count || 0 };
    });

    const typeResults = await Promise.all(typePromises);

    // 타입별 결과 집계 객체에 반영
    typeResults.forEach(({ type, count }) => {
      aggregate.count_by_type[type as NotificationType] = count;
    });

    // 3. 상태별 알림 개수 조회
    const statusPromises = Object.values(NotificationStatus).map(async (status) => {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        
        return { status, count: 0 };
      }

      return { status, count: count || 0 };
    });

    const statusResults = await Promise.all(statusPromises);

    // 상태별 결과 집계 객체에 반영
    statusResults.forEach(({ status, count }) => {
      aggregate.count_by_status[status as NotificationStatus] = count;
    });

    // 4. 역할별 알림 개수 조회
    // 4.1. 모든 알림의 사용자 ID 추출
    const { data: notificationUsers, error: userError } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .limit(10000);  // 대량 데이터 고려하여 제한

    if (userError) {
      
    } else if (notificationUsers && notificationUsers.length > 0) {
      // 유니크한 사용자 ID 목록 생성
      const uniqueUserIds = [...new Set(notificationUsers.map(n => n.user_id))];

      // 사용자 ID별 알림 개수 매핑
      const userIdAlertCount: Record<string, number> = {};
      notificationUsers.forEach(n => {
        if (!userIdAlertCount[n.user_id]) {
          userIdAlertCount[n.user_id] = 0;
        }
        userIdAlertCount[n.user_id]++;
      });

      // 4.2. 사용자 역할 조회
      const { data: users, error: roleError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .in('id', uniqueUserIds);

      if (roleError) {
        
      } else if (users) {
        // 역할별 알림 개수 집계
        users.forEach(user => {
          const role = user.role || 'unknown';
          const count = userIdAlertCount[user.id] || 0;

          // 기존 역할 필드에 있으면 더하고, 없으면 새로 생성
          if (aggregate.count_by_role[role] !== undefined) {
            aggregate.count_by_role[role] += count;
          } else {
            aggregate.count_by_role[role] = count;
          }
        });
      }
    }

    // 5. 집계 테이블 업데이트
    // 이전 집계 확인
    const { data: existingAggregate, error: fetchError } = await supabaseAdmin
      .from('notification_aggregates')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // 'PGRST116'는 결과가 없을 때의 에러 코드
      
      toast.dismiss();
      toast.error('알림 통계 집계 중 오류가 발생했습니다.');
      return false;
    }

    // 결과 저장
    if (existingAggregate) {
      // 기존 데이터 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('notification_aggregates')
        .update({
          ...aggregate,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAggregate.id);

      if (updateError) {
        
        toast.dismiss();
        toast.error('알림 통계 업데이트 중 오류가 발생했습니다.');
        return false;
      }
    } else {
      // 새 데이터 생성
      const { error: insertError } = await supabaseAdmin
        .from('notification_aggregates')
        .insert({
          ...aggregate,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        
        toast.dismiss();
        toast.error('알림 통계 생성 중 오류가 발생했습니다.');
        return false;
      }
    }

    
    toast.dismiss();
    toast.success('알림 통계가 성공적으로 업데이트되었습니다.');
    return true;

  } catch (error: any) {
    
    toast.dismiss();
    toast.error(`알림 통계 집계 중 오류: ${error.message || '알 수 없는 오류'}`);
    return false;
  }
};

// 브라우저 콘솔에서 직접 실행할 수 있도록 전역 객체에 함수 노출
// TypeScript에서 window 객체에 추가하려면 interface를 확장해야 함
declare global {
  interface Window {
    validateNotificationTable: typeof validateAggregateTable;
    refreshNotificationStats: typeof refreshStats;
  }
}

if (typeof window !== 'undefined') {
  window.validateNotificationTable = validateAggregateTable;
  window.refreshNotificationStats = refreshStats;

  // 메시지 표시
  
  
  
  
}