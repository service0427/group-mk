import { supabaseAdmin } from '@/supabase';
import {
  NotificationType,
  NotificationStatus
} from '@/types/notification';
import { INotificationAggregate } from '@/types/notification/statistics';

// 기본 집계 객체 생성 함수
const createDefaultAggregate = (): Omit<INotificationAggregate, 'id' | 'updated_at'> => ({
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
 * 집계 테이블 초기화 
 * (아직 집계 데이터가 없을 경우 최초 생성)
 */
export const initializeAggregateTable = async (): Promise<boolean> => {
  try {
    // 현재 집계 데이터 확인
    const { data, error: checkError } = await supabaseAdmin
      .from('notification_aggregates')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('does not exist')) {
        console.error('집계 테이블이 존재하지 않습니다:', checkError.message);
        return false;
      }

      console.error('집계 테이블 확인 중 오류 발생:', checkError.message);
      return false;
    }

    // 집계 데이터가 없으면 생성
    if (!data || data.length === 0) {
      const defaultAggregate = createDefaultAggregate();

      const { error: createError } = await supabaseAdmin
        .from('notification_aggregates')
        .insert({
          ...defaultAggregate,
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('집계 테이블 초기화 중 오류 발생:', createError.message);
        return false;
      }

      return true;
    }

    // 이미 데이터가 있으면 초기화 완료로 간주
    return true;

  } catch (error: any) {
    console.error('집계 테이블 초기화 중 예외 발생:', error.message);
    return false;
  }
};

/**
 * 집계 데이터 가져오기
 */
export const fetchNotificationAggregate = async (): Promise<INotificationAggregate | null> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_aggregates')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('집계 데이터 조회 중 오류 발생:', error.message);
      return null;
    }

    return data as INotificationAggregate;

  } catch (error: any) {
    console.error('집계 데이터 조회 중 예외 발생:', error.message);
    return null;
  }
};

/**
 * 알림 통계 전체 갱신
 * 모든 알림 데이터를 스캔하여 집계 테이블 업데이트
 *
 * @param showToast 토스트 알림을 표시하기 위한 함수 (옵션)
 *
 * 마이그레이션 참고: 이전 버전과의 호환성을 위해 두 가지 방식 모두 지원
 * - showToast: 새로운 커스텀 토스트 함수
 * - setNotification: 기존 커스텀 토스트 상태 설정 함수
 */
export const refreshNotificationAggregate = async (
  showToastOrSetNotification?:
    | ((message: string, type: 'success' | 'error') => void)
    | ((notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)
): Promise<boolean> => {
  try {
    // 함수가 제공된 경우 토스트 표시, 아니면 콘솔 로깅
    if (showToastOrSetNotification) {
      // 함수 타입 확인 (매개변수 개수로 구분)
      const isNewToastFn = showToastOrSetNotification.length === 2;

      if (isNewToastFn) {
        // 새로운 커스텀 토스트 API 사용
        (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
          '알림 통계 집계 중...',
          'success'
        );
      } else {
        // 기존 커스텀 토스트 상태 설정 API 사용
        (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
          { show: true, message: '알림 통계 집계 중...', type: 'success' }
        );
      }
    } else {
      console.log('알림 통계 집계 중...');
    }

    // 초기 집계 객체 생성
    const aggregate = createDefaultAggregate();

    // 1. 전체 알림 개수 조회
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('전체 알림 개수 조회 중 오류 발생:', countError.message);
      if (showToastOrSetNotification) {
        // 함수 타입 확인 (매개변수 개수로 구분)
        const isNewToastFn = showToastOrSetNotification.length === 2;

        if (isNewToastFn) {
          // 새로운 커스텀 토스트 API 사용
          (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
            '알림 통계 업데이트 중 오류가 발생했습니다.',
            'error'
          );
        } else {
          // 기존 커스텀 토스트 상태 설정 API 사용
          (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
            { show: true, message: '알림 통계 업데이트 중 오류가 발생했습니다.', type: 'error' }
          );
        }
      }
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
      aggregate.count_by_type[type as NotificationType] = count;
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
      aggregate.count_by_status[status as NotificationStatus] = count;
    });

    // 4. 역할별 알림 개수 조회
    // (복잡한 조인이 필요하므로 단계별 처리)

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
      if (showToastOrSetNotification) {
        // 함수 타입 확인 (매개변수 개수로 구분)
        const isNewToastFn = showToastOrSetNotification.length === 2;

        if (isNewToastFn) {
          // 새로운 커스텀 토스트 API 사용
          (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
            '알림 통계 업데이트 중 오류가 발생했습니다.',
            'error'
          );
        } else {
          // 기존 커스텀 토스트 상태 설정 API 사용
          (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
            { show: true, message: '알림 통계 업데이트 중 오류가 발생했습니다.', type: 'error' }
          );
        }
      }
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
        if (showToastOrSetNotification) {
          // 함수 타입 확인 (매개변수 개수로 구분)
          const isNewToastFn = showToastOrSetNotification.length === 2;

          if (isNewToastFn) {
            // 새로운 커스텀 토스트 API 사용
            (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
              '알림 통계 업데이트 중 오류가 발생했습니다.',
              'error'
            );
          } else {
            // 기존 커스텀 토스트 상태 설정 API 사용
            (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
              { show: true, message: '알림 통계 업데이트 중 오류가 발생했습니다.', type: 'error' }
            );
          }
        }
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
        if (showToastOrSetNotification) {
          // 함수 타입 확인 (매개변수 개수로 구분)
          const isNewToastFn = showToastOrSetNotification.length === 2;

          if (isNewToastFn) {
            // 새로운 커스텀 토스트 API 사용
            (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
              '알림 통계 생성 중 오류가 발생했습니다.',
              'error'
            );
          } else {
            // 기존 커스텀 토스트 상태 설정 API 사용
            (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
              { show: true, message: '알림 통계 생성 중 오류가 발생했습니다.', type: 'error' }
            );
          }
        }
        return false;
      }
    }

    if (showToastOrSetNotification) {
      // 함수 타입 확인 (매개변수 개수로 구분)
      const isNewToastFn = showToastOrSetNotification.length === 2;

      if (isNewToastFn) {
        // 새로운 커스텀 토스트 API 사용
        (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
          '알림 통계가 성공적으로 업데이트되었습니다.',
          'success'
        );
      } else {
        // 기존 커스텀 토스트 상태 설정 API 사용
        (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
          { show: true, message: '알림 통계가 성공적으로 업데이트되었습니다.', type: 'success' }
        );
      }
    }
    return true;

  } catch (error: any) {
    console.error('알림 통계 집계 중 예외 발생:', error.message);
    if (showToastOrSetNotification) {
      // 함수 타입 확인 (매개변수 개수로 구분)
      const isNewToastFn = showToastOrSetNotification.length === 2;

      if (isNewToastFn) {
        // 새로운 커스텀 토스트 API 사용
        (showToastOrSetNotification as (message: string, type: 'success' | 'error') => void)(
          `알림 통계 업데이트 중 오류: ${error.message}`,
          'error'
        );
      } else {
        // 기존 커스텀 토스트 상태 설정 API 사용
        (showToastOrSetNotification as (notification: { show: boolean; message: string; type: 'success' | 'error' }) => void)(
          { show: true, message: `알림 통계 업데이트 중 오류: ${error.message}`, type: 'error' }
        );
      }
    }
    return false;
  }
};

/**
 * 단일 알림 추가 시 증분 업데이트
 * 전체 재계산 없이 카운터만 증가
 */
export const incrementNotificationAggregate = async (
  type: NotificationType,
  userRole: string
): Promise<boolean> => {
  try {

    // 현재 집계 데이터 가져오기
    const { data: aggregate, error: fetchError } = await supabaseAdmin
      .from('notification_aggregates')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('집계 데이터 조회 중 오류 발생:', fetchError.message);
      // 실패시 전체 갱신 시도
      return await refreshNotificationAggregate();
    }

    // 업데이트 대상 필드 준비
    const updates: any = {
      total_count: (aggregate?.total_count || 0) + 1,
      updated_at: new Date().toISOString()
    };

    // 타입별 카운터 증가
    if (type in NotificationType) {
      const typeField = `count_by_type:${type}`;
      updates[typeField] = (aggregate?.count_by_type?.[type] || 0) + 1;
    }

    // 상태별 카운터 증가 (신규 알림은 항상 UNREAD)
    const statusField = `count_by_status:${NotificationStatus.UNREAD}`;
    updates[statusField] = (aggregate?.count_by_status?.[NotificationStatus.UNREAD] || 0) + 1;

    // 역할별 카운터 증가
    if (userRole) {
      const roleField = `count_by_role:${userRole}`;

      // 역할 필드가 있으면 증가, 없으면 새로 추가
      if (aggregate?.count_by_role && userRole in aggregate.count_by_role) {
        updates[roleField] = (aggregate.count_by_role[userRole] || 0) + 1;
      } else {
        // 새 역할일 경우 role 객체 전체를 복제하고 새 값 추가
        const newRoleCount = { ...aggregate?.count_by_role };
        newRoleCount[userRole] = 1;
        updates.count_by_role = newRoleCount;
      }
    }

    // 집계 테이블 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('notification_aggregates')
      .update(updates)
      .eq('id', aggregate.id);

    if (updateError) {
      console.error('집계 데이터 증분 업데이트 중 오류 발생:', updateError.message);
      // 실패시 전체 갱신 시도
      return await refreshNotificationAggregate();
    }

    return true;

  } catch (error: any) {
    console.error('알림 통계 증분 업데이트 중 예외 발생:', error.message);
    // 실패시 전체 갱신 시도
    return await refreshNotificationAggregate();
  }
};

/**
 * 알림 상태 변경 시 증분 업데이트
 */
export const updateNotificationStatusAggregate = async (
  oldStatus: NotificationStatus,
  newStatus: NotificationStatus,
  count: number = 1
): Promise<boolean> => {
  try {
    if (oldStatus === newStatus) return true; // 변경 없음


    // 현재 집계 데이터 가져오기
    const { data: aggregate, error: fetchError } = await supabaseAdmin
      .from('notification_aggregates')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('집계 데이터 조회 중 오류 발생:', fetchError.message);
      // 실패시 전체 갱신 시도
      return await refreshNotificationAggregate();
    }

    // 업데이트 대상 필드 준비
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // 이전 상태 카운터 감소
    const oldStatusField = `count_by_status:${oldStatus}`;
    updates[oldStatusField] = Math.max(0, (aggregate?.count_by_status?.[oldStatus] || 0) - count);

    // 새 상태 카운터 증가
    const newStatusField = `count_by_status:${newStatus}`;
    updates[newStatusField] = (aggregate?.count_by_status?.[newStatus] || 0) + count;

    // 집계 테이블 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('notification_aggregates')
      .update(updates)
      .eq('id', aggregate.id);

    if (updateError) {
      console.error('집계 데이터 상태 업데이트 중 오류 발생:', updateError.message);
      // 실패시 전체 갱신 시도
      return await refreshNotificationAggregate();
    }

    return true;

  } catch (error: any) {
    console.error('알림 통계 상태 업데이트 중 예외 발생:', error.message);
    // 실패시 전체 갱신 시도
    return await refreshNotificationAggregate();
  }
};

/**
 * 알림 삭제 시 통계 업데이트
 */
export const decrementNotificationAggregate = async (
  type: NotificationType,
  status: NotificationStatus,
  userRole: string
): Promise<boolean> => {
  try {

    // 현재 집계 데이터 가져오기
    const { data: aggregate, error: fetchError } = await supabaseAdmin
      .from('notification_aggregates')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('집계 데이터 조회 중 오류 발생:', fetchError.message);
      // 실패시 전체 갱신 시도
      return await refreshNotificationAggregate();
    }

    // 업데이트 대상 필드 준비
    const updates: any = {
      total_count: Math.max(0, (aggregate?.total_count || 0) - 1),
      updated_at: new Date().toISOString()
    };

    // 타입별 카운터 감소
    if (type in NotificationType) {
      const typeField = `count_by_type:${type}`;
      updates[typeField] = Math.max(0, (aggregate?.count_by_type?.[type] || 0) - 1);
    }

    // 상태별 카운터 감소
    if (status in NotificationStatus) {
      const statusField = `count_by_status:${status}`;
      updates[statusField] = Math.max(0, (aggregate?.count_by_status?.[status] || 0) - 1);
    }

    // 역할별 카운터 감소
    if (userRole && aggregate?.count_by_role && userRole in aggregate.count_by_role) {
      const roleField = `count_by_role:${userRole}`;
      updates[roleField] = Math.max(0, (aggregate.count_by_role[userRole] || 0) - 1);
    }

    // 집계 테이블 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('notification_aggregates')
      .update(updates)
      .eq('id', aggregate.id);

    if (updateError) {
      console.error('집계 데이터 감소 업데이트 중 오류 발생:', updateError.message);
      // 실패시 전체 갱신 시도
      return await refreshNotificationAggregate();
    }

    return true;

  } catch (error: any) {
    console.error('알림 통계 감소 업데이트 중 예외 발생:', error.message);
    // 실패시 전체 갱신 시도
    return await refreshNotificationAggregate();
  }
};

/**
 * 대량 알림 삭제 시 통계 업데이트
 * 대량 삭제의 경우 증분 업데이트가 아닌 전체 재계산 수행
 */
export const handleBulkDeleteAggregate = async (): Promise<boolean> => {
  return await refreshNotificationAggregate();
};
