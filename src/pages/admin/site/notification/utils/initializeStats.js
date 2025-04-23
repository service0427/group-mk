// 알림 통계 테이블 초기화 유틸리티
import { supabaseAdmin } from '@/supabase';
import { toast } from 'sonner';

// 알림 타입 및 상태 상수
const NotificationType = {
  SYSTEM: 'system',
  TRANSACTION: 'transaction',
  SERVICE: 'service',
  SLOT: 'slot',
  MARKETING: 'marketing'
};

const NotificationStatus = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived'
};

// 기본 집계 객체 생성 함수
const createDefaultAggregate = () => ({
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
export const validateAggregateTable = async () => {
  try {
    // 테이블 존재 여부 확인
    const { data, error } = await supabaseAdmin
      .from('notification_aggregates')
      .select('id')
      .limit(1);

    if (error) {
      console.error('테이블 검증 오류:', error.message);
      toast.error('통계 테이블 검증 실패: ' + error.message);
      return false;
    }

    console.log('테이블 검증 성공:', data);
    toast.success('통계 테이블이 정상적으로 존재합니다');
    return true;
  } catch (error) {
    console.error('테이블 검증 예외:', error);
    toast.error('통계 테이블 검증 중 예외 발생');
    return false;
  }
};

/**
 * 알림 통계 전체 갱신
 */
export const refreshStats = async () => {
  try {
    toast.loading('알림 통계 집계 중...');
    console.log('알림 통계 전체 집계 시작');

    // 초기 집계 객체 생성
    const aggregate = createDefaultAggregate();

    // 1. 전체 알림 개수 조회
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('전체 알림 개수 조회 중 오류 발생:', countError.message);
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
        console.error(`${type} 타입 알림 개수 조회 중 오류 발생:`, error.message);
        return { type, count: 0 };
      }

      return { type, count: count || 0 };
    });

    const typeResults = await Promise.all(typePromises);

    // 타입별 결과 집계 객체에 반영
    typeResults.forEach(({ type, count }) => {
      aggregate.count_by_type[type] = count;
    });

    // 3. 상태별 알림 개수 조회
    const statusPromises = Object.values(NotificationStatus).map(async (status) => {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        console.error(`${status} 상태 알림 개수 조회 중 오류 발생:`, error.message);
        return { status, count: 0 };
      }

      return { status, count: count || 0 };
    });

    const statusResults = await Promise.all(statusPromises);

    // 상태별 결과 집계 객체에 반영
    statusResults.forEach(({ status, count }) => {
      aggregate.count_by_status[status] = count;
    });

    // 4. 역할별 알림 개수 조회
    // 4.1. 모든 알림의 사용자 ID 추출
    const { data: notificationUsers, error: userError } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .limit(10000);  // 대량 데이터 고려하여 제한

    if (userError) {
      console.error('알림 사용자 ID 조회 중 오류 발생:', userError.message);
    } else if (notificationUsers && notificationUsers.length > 0) {
      // 유니크한 사용자 ID 목록 생성
      const uniqueUserIds = [...new Set(notificationUsers.map(n => n.user_id))];

      // 사용자 ID별 알림 개수 매핑
      const userIdAlertCount = {};
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
        console.error('사용자 역할 조회 중 오류 발생:', roleError.message);
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
      console.error('기존 집계 데이터 확인 중 오류 발생:', fetchError.message);
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
        console.error('집계 데이터 업데이트 중 오류 발생:', updateError.message);
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
        console.error('집계 데이터 생성 중 오류 발생:', insertError.message);
        toast.dismiss();
        toast.error('알림 통계 생성 중 오류가 발생했습니다.');
        return false;
      }
    }

    console.log('알림 통계 집계 완료', new Date().toISOString());
    toast.dismiss();
    toast.success('알림 통계가 성공적으로 업데이트되었습니다.');
    return true;

  } catch (error) {
    console.error('알림 통계 집계 중 예외 발생:', error);
    toast.dismiss();
    toast.error(`알림 통계 집계 중 오류: ${error.message || '알 수 없는 오류'}`);
    return false;
  }
};

// 콘솔에서 직접 실행할 수 있도록 전역 객체에 함수 노출
window.validateNotificationTable = validateAggregateTable;
window.refreshNotificationStats = refreshStats;

// 메시지 표시
console.log('알림 통계 초기화 유틸리티가 로드되었습니다.');
console.log('다음 함수를 사용할 수 있습니다:');
console.log('- window.validateNotificationTable(): 테이블 존재 확인');
console.log('- window.refreshNotificationStats(): 통계 갱신');
