import { supabase, supabaseAdmin } from '@/supabase';
import { INotification, NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification';
import { USER_ROLES } from '@/config/roles.config';
import { toast } from 'sonner';

// 알림 페이지네이션 조회 결과 인터페이스
export interface INotificationWithUser extends INotification {
  userName: string;
  userRole: string;
}

export interface NotificationStats {
  total: number;
  byType: Record<NotificationType, number>;
  byUserRole: Record<string, number>;
  byStatus: Record<NotificationStatus, number>;
}

export interface FetchNotificationsParams {
  page: number;
  itemsPerPage: number;
  filterType?: NotificationType | 'all';
  filterUserRole?: string | 'all';
}

// 알림 목록 조회
export const fetchNotifications = async ({
  page = 1,
  itemsPerPage = 30,
  filterType = 'all',
  filterUserRole = 'all'
}: FetchNotificationsParams): Promise<{
  data: INotificationWithUser[];
  totalCount: number;
  totalPages: number;
  statusCounts: Record<NotificationStatus, number>;
}> => {
  try {
    // 필터 조건 설정
    let countQuery = supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true });
    let dataQuery = supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // 타입 필터링
    if (filterType !== 'all') {
      countQuery = countQuery.eq('type', filterType);
      dataQuery = dataQuery.eq('type', filterType);
    }

    // 전체 알림 개수 조회 (페이지네이션 정보 계산용)
    const { count, error: countError } = await countQuery;

    if (countError) {
      
      toast.error('알림 정보를 불러오는데 실패했습니다.');
      throw countError;
    }

    // 상태별 알림 개수 조회 (추가 통계)
    const statusCounts: Record<NotificationStatus, number> = {
      [NotificationStatus.UNREAD]: 0,
      [NotificationStatus.READ]: 0,
      [NotificationStatus.ARCHIVED]: 0
    };

    try {
      // 읽지 않은 알림 수
      const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', NotificationStatus.UNREAD);

      // 읽은 알림 수  
      const { count: readCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', NotificationStatus.READ);

      // 보관된 알림 수
      const { count: archivedCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', NotificationStatus.ARCHIVED);

      statusCounts[NotificationStatus.UNREAD] = unreadCount || 0;
      statusCounts[NotificationStatus.READ] = readCount || 0;
      statusCounts[NotificationStatus.ARCHIVED] = archivedCount || 0;
    } catch (error) {
      
    }

    // 페이지네이션 정보 계산
    const total = count || 0;
    const pages = Math.ceil(total / itemsPerPage);

    // 페이지 범위 확인
    const validPage = Math.min(Math.max(1, page), pages || 1);
    const from = (validPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    dataQuery = dataQuery.range(from, to);

    const { data, error } = await dataQuery;

    if (error) {
      
      toast.error('알림 데이터를 불러오는데 실패했습니다.');
      throw error;
    }

    // 데이터가 없는 경우 빈 배열 처리
    if (!data || data.length === 0) {
      return {
        data: [],
        totalCount: total,
        totalPages: pages || 1,
        statusCounts
      };
    }

    // 모든 사용자 ID 추출
    const userIds = [...new Set(data.map((item: any) => item.user_id))];

    try {
      // 사용자 정보 일괄 조회 - 배치 처리 적용 (최대 100명씩)
      const batchSize = 100;
      let allUsers: any[] = [];

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batchIds = userIds.slice(i, i + batchSize);

        const { data: batchUsers, error: batchError } = await supabaseAdmin
          .from('users')
          .select('id, full_name, role')
          .in('id', batchIds);

        if (!batchError && batchUsers) {
          allUsers = [...allUsers, ...batchUsers];
        }
      }

      // 사용자 ID를 키로 하는 객체로 변환
      const userData = allUsers.reduce((acc: Record<string, any>, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // 데이터 타입 변환 및 사용자 정보 추가
      const typedData = data.map((item: any) => {
        const user = userData[item.user_id] || {};

        return {
          ...item,
          userId: item.user_id,
          type: item.type as NotificationType,
          priority: item.priority as NotificationPriority,
          status: item.status as NotificationStatus,
          createdAt: item.created_at,
          expiresAt: item.expires_at,
          userRole: user.role || 'unknown',
          userName: user.full_name || '알 수 없는 사용자'
        };
      });

      // 역할별 필터링 (조인 대신 메모리에서 필터링)
      if (filterUserRole !== 'all') {
        const filteredData = typedData.filter(
          (item: any) => item.userRole === filterUserRole
        );

        // 역할 필터링에 따른 페이지네이션 계산
        const filteredCount = filteredData.length;
        const filteredPages = Math.ceil(filteredData.length / itemsPerPage);

        return {
          data: filteredData,
          totalCount: filteredCount,
          totalPages: filteredPages || 1,
          statusCounts
        };
      }

      return {
        data: typedData,
        totalCount: total,
        totalPages: pages || 1,
        statusCounts
      };
    } catch (userError) {
      

      // 오류가 발생해도 알림 데이터는 표시 (사용자 정보 없이)
      const basicTypedData = data.map((item: any) => ({
        ...item,
        userId: item.user_id,
        type: item.type as NotificationType,
        priority: item.priority as NotificationPriority,
        status: item.status as NotificationStatus,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        userRole: 'unknown',
        userName: '알 수 없는 사용자'
      }));

      return {
        data: basicTypedData,
        totalCount: total,
        totalPages: pages || 1,
        statusCounts
      };
    }
  } catch (error: any) {
    
    throw error;
  }
};

// 알림 통계 계산
export const calculateStats = async (
  notificationData: INotificationWithUser[],
  totalCount: number,
  statusCounts: Record<NotificationStatus, number>
): Promise<NotificationStats> => {
  // 기본 통계 정보 구조 설정
  const typeCount = {
    [NotificationType.SYSTEM]: 0,
    [NotificationType.TRANSACTION]: 0,
    [NotificationType.SERVICE]: 0,
    [NotificationType.SLOT]: 0,
    [NotificationType.MARKETING]: 0,
  };

  const roleCount = {
    [USER_ROLES.DEVELOPER]: 0,
    [USER_ROLES.OPERATOR]: 0,
    [USER_ROLES.DISTRIBUTOR]: 0,
    [USER_ROLES.AGENCY]: 0,
    [USER_ROLES.ADVERTISER]: 0,
  };

  try {
    // 타입별 알림 개수 조회 (전체 알림 기준)
    const typePromises = Object.keys(typeCount).map(async (type) => {
      const { count } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', type);

      return { type, count: count || 0 };
    });

    const typeResults = await Promise.all(typePromises);

    // 조회 결과 적용
    typeResults.forEach(({ type, count }) => {
      typeCount[type as NotificationType] = count;
    });

    // 사용자 역할별 알림 분포 조회
    // 사용자 역할 정보는 notifications 테이블에 없으므로
    // users 테이블과 조인하거나 별도 쿼리가 필요합니다

    // 1. 모든 알림의 사용자 ID 세트를 추출
    // (이 부분은 데이터 양이 많을 수 있으므로 최적화 필요)
    const { data: allNotificationUsers } = await supabaseAdmin
      .from('notifications')
      .select('user_id')
      .limit(10000);  // 최대 10,000개만 처리 (필요시 페이지네이션 구현)

    if (allNotificationUsers && allNotificationUsers.length > 0) {
      // 유니크한 사용자 ID 목록 생성
      const uniqueUserIds = [...new Set(allNotificationUsers.map(n => n.user_id))];

      // 역할별 사용자 수 집계
      const { data: userRoles } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .in('id', uniqueUserIds);

      if (userRoles) {
        // 각 사용자별로 알림 수 계산을 위한 매핑
        const userIdAlertCount: Record<string, number> = {};

        // 각 사용자 ID별 알림 개수 조회
        allNotificationUsers.forEach(n => {
          if (!userIdAlertCount[n.user_id]) {
            userIdAlertCount[n.user_id] = 0;
          }
          userIdAlertCount[n.user_id]++;
        });

        // 역할별 알림 개수 합산
        userRoles.forEach(user => {
          const role = user.role as keyof typeof roleCount;
          if (roleCount[role] !== undefined && userIdAlertCount[user.id]) {
            roleCount[role] += userIdAlertCount[user.id];
          }
        });
      }
    }

    return {
      total: totalCount,
      byType: typeCount,
      byUserRole: roleCount,
      byStatus: statusCounts
    };
  } catch (error) {
    

    // 오류 발생 시에도 기본 통계 정보는 반환
    return {
      total: totalCount,
      byType: typeCount,
      byUserRole: roleCount,
      byStatus: statusCounts
    };
  }
};

// 알림 삭제 함수
export interface DeleteNotificationsOptions {
  type: 'selected' | 'older' | 'all';
  ids?: string[];
  olderThan?: Date;
}

export const deleteNotifications = async (options: DeleteNotificationsOptions): Promise<boolean> => {
  try {
    // 진행 상태 메시지 표시
    toast.loading('알림 삭제 작업 준비 중...');

    let totalCount = 0;
    let processedCount = 0;
    let batchSize = 200; // 한 번에 처리할 알림 수

    // 1. 전체 삭제할 알림 수 파악
    if (options.type === 'selected' && options.ids && options.ids.length > 0) {
      totalCount = options.ids.length;
    } else if (options.type === 'older' && options.olderThan) {
      // 날짜보다 오래된 알림 개수 조회
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', options.olderThan.toISOString());

      if (error) {
        
        toast.dismiss();
        toast.error('알림 개수 조회 중 오류가 발생했습니다.');
        return false;
      }

      totalCount = count || 0;
    } else if (options.type === 'all') {
      // 전체 알림 개수 조회
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      if (error) {
        
        toast.dismiss();
        toast.error('알림 개수 조회 중 오류가 발생했습니다.');
        return false;
      }

      totalCount = count || 0;
    }

    // 삭제할 알림이 없는 경우
    if (totalCount === 0) {
      toast.dismiss();
      toast.info('삭제할 알림이 없습니다.');
      return true;
    }

    // 진행 상태 업데이트
    toast.loading(`알림 삭제 준비 완료 (총 ${totalCount}개)`);

    // 2. 대량 삭제 시 배치 처리, 소량 삭제 시 직접 삭제
    if (totalCount > 1000) {
      // 대량 삭제 - Soft Delete 방식으로 처리 (status를 'archived'로 변경)
      toast.loading(`대량 알림 처리 중... (아카이브 방식)`);

      if (options.type === 'selected' && options.ids && options.ids.length > 0) {
        // ID 목록이 많은 경우 배치 처리
        for (let i = 0; i < options.ids.length; i += batchSize) {
          const batch = options.ids.slice(i, i + batchSize);

          const { error } = await supabaseAdmin
            .from('notifications')
            .update({ status: NotificationStatus.ARCHIVED })
            .in('id', batch);

          if (error) {
            
          }

          processedCount += batch.length;
          toast.loading(`알림 아카이브 처리 중... (${processedCount}/${totalCount})`);

          // 서버 부하 방지를 위해 약간의 지연 추가
          if (i + batchSize < options.ids.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } else {
        // 날짜 기준 또는 전체 삭제의 경우
        let query = supabaseAdmin
          .from('notifications')
          .update({ status: NotificationStatus.ARCHIVED });

        if (options.type === 'older' && options.olderThan) {
          query = query.lt('created_at', options.olderThan.toISOString());
        } else if (options.type === 'all') {
          // 전체 삭제의 경우 created_at IS NOT NULL을 조건으로 추가 (모든 레코드를 대상으로)
          query = query.not('created_at', 'is', null);
        }

        const { error } = await query;

        if (error) {
          
          toast.dismiss();
          toast.error('알림 아카이브 중 오류가 발생했습니다.');
          return false;
        }

        processedCount = totalCount;
        toast.loading(`알림 아카이브 처리 완료 (${processedCount}/${totalCount})`);
      }
    } else {
      // 소량 삭제 - 직접 삭제 처리
      toast.loading(`알림 삭제 중... (0/${totalCount})`);

      if (options.type === 'selected' && options.ids && options.ids.length > 0) {
        // ID 목록이 많지 않은 경우에도 배치 처리
        for (let i = 0; i < options.ids.length; i += batchSize) {
          const batch = options.ids.slice(i, i + batchSize);

          const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .in('id', batch);

          if (error) {
            
          }

          processedCount += batch.length;
          toast.loading(`알림 삭제 중... (${processedCount}/${totalCount})`);

          // 서버 부하 방지를 위해 약간의 지연 추가
          if (i + batchSize < options.ids.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } else if (options.type === 'older' && options.olderThan) {
        // 날짜 기준 삭제
        const { error } = await supabaseAdmin
          .from('notifications')
          .delete()
          .lt('created_at', options.olderThan.toISOString());

        if (error) {
          
          toast.dismiss();
          toast.error('알림 삭제 중 오류가 발생했습니다.');
          return false;
        }

        processedCount = totalCount;
        toast.loading(`알림 삭제 중... (${processedCount}/${totalCount})`);
      } else if (options.type === 'all') {
        // 전체 삭제 - Supabase에서는 WHERE 절 없이 DELETE를 허용하지 않으므로
        // 모든 알림의 ID를 조회한 후 배치로 삭제
        try {
          toast.loading(`알림 ID 목록 가져오는 중...`);

          // 모든 알림 ID 조회
          const { data: allIds, error: idError } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .limit(10000); // 최대 1만개까지만 처리 (필요시 더 많이 처리하려면 페이지네이션 로직 추가 필요)

          if (idError) {
            
            toast.dismiss();
            toast.error('알림 ID 조회 중 오류가 발생했습니다.');
            return false;
          }

          if (!allIds || allIds.length === 0) {
            toast.dismiss();
            toast.info('삭제할 알림이 없습니다.');
            return true;
          }

          const allNotificationIds = allIds.map(item => item.id);
          const totalToDelete = allNotificationIds.length;
          toast.loading(`총 ${totalToDelete}개 알림 삭제 준비 완료`);

          // 배치 처리로 삭제
          let deleted = 0;
          for (let i = 0; i < allNotificationIds.length; i += batchSize) {
            const batch = allNotificationIds.slice(i, i + batchSize);

            const { error: deleteError } = await supabaseAdmin
              .from('notifications')
              .delete()
              .in('id', batch);

            if (deleteError) {
              
            } else {
              deleted += batch.length;
            }

            toast.loading(`알림 삭제 중... (${deleted}/${totalToDelete})`);

            // 서버 부하 방지를 위해 약간의 지연 추가
            if (i + batchSize < allNotificationIds.length) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          processedCount = deleted;
        } catch (error: any) {
          
          toast.dismiss();
          toast.error(`전체 알림 삭제 중 오류 발생: ${error.message}`);
          return false;
        }
      }
    }

    // 3. 작업 완료 메시지 표시
    toast.dismiss();
    toast.success(`알림 처리 완료: ${processedCount}개`);

    // 알림 통계 업데이트
    try {
      // 대량 삭제이므로 전체 통계 갱신
      await handleBulkDeleteAggregate();
    } catch (statsError) {
      
      // 통계 업데이트 실패는 알림 삭제 성공 여부에 영향을 주지 않음
    }

    return true;
  } catch (error: any) {
    
    toast.dismiss();
    toast.error(`알림 삭제 중 오류 발생: ${error.message}`);
    return false;
  }
};

import {
  incrementNotificationAggregate,
  handleBulkDeleteAggregate,
  updateNotificationStatusAggregate,
  refreshNotificationAggregate
} from './notificationAggregateService';

// 다중 알림 생성 함수
export interface CreateNotificationsParams {
  notificationData: Omit<INotification, 'id' | 'userId' | 'createdAt'>;
  target: {
    type: 'role' | 'user';
    value: string | string[];
  }
}

export const createMultipleNotifications = async (
  { notificationData, target }: CreateNotificationsParams
): Promise<boolean> => {
  try {
    let userIds: string[] = [];

    if (target.type === 'role') {
      let query = supabaseAdmin.from('users').select('id');

      // 'all'이 아닌 경우에만 특정 역할로 필터링
      if (target.value !== 'all') {
        query = query.eq('role', target.value);
      }

      const { data, error } = await query;

      if (error) {
        
        toast.error('사용자 ID 조회 중 오류가 발생했습니다.');
        return false;
      }

      userIds = data.map(user => user.id);
    } else if (target.type === 'user') {
      // 특정 사용자 ID 배열 사용
      userIds = Array.isArray(target.value) ? target.value : [target.value];
    }

    if (userIds.length === 0) {
      
      toast.error('알림을 보낼 사용자가 없습니다.');
      return false;
    }

    // 배치 크기 설정 (한 번에 100명씩 처리)
    const batchSize = 100;
    let successCount = 0;
    let failCount = 0;

    // 전송 진행 상태 메시지 표시
    toast.loading(`알림 전송 중... (0/${userIds.length})`);

    // 배치 처리
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // 각 사용자에게 알림 생성
      const notificationsToInsert = batch.map(userId => ({
        user_id: userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        link: notificationData.link,
        icon: notificationData.icon,
        priority: notificationData.priority,
        status: NotificationStatus.UNREAD,
        expires_at: notificationData.expiresAt
      }));

      try {
        // 관리자 권한으로 알림 생성 시도 (RLS 정책 우회 확인)
        

        // 커스텀 헤더를 추가하여 명시적으로 서비스 롤 설정
        const { error } = await supabaseAdmin
          .from('notifications')
          .insert(notificationsToInsert)
          .select(); // select를 추가하여 응답 확인

        if (error) {
          

          // RLS 오류 발생 시 대체 방식 시도 (직접 헤더 설정)
          if (error.message.includes('row-level security')) {
            

            // 직접 서비스 롤 키를 헤더에 명시적으로 지정하는 방식 시도
            // Create a custom fetch function with the headers
            const customFetch = async (url: string, options: RequestInit) => {
              const modifiedOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`
                }
              };
              return fetch(url, modifiedOptions);
            };
            
            // Use standard insert without the headers parameter
            const { error: retryError } = await supabase
              .from('notifications')
              .insert(notificationsToInsert);

            if (retryError) {
              
              throw retryError;
            } else {
              
              successCount += batch.length;
            }
          } else {
            throw error;
          }
        } else {
          
          // 성공 처리
          successCount += batch.length;
        }
      } catch (err: any) {
        
        toast.error(`알림 전송 중 오류: ${err.message}`);
        // 실패 처리
        failCount += batch.length;
      }

      // 진행 상태 업데이트
      toast.loading(`알림 전송 중... (${Math.min(i + batchSize, userIds.length)}/${userIds.length})`);

      // 서버 부하 방지를 위해 약간의 지연 추가
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 결과 메시지 표시
    toast.dismiss();
    if (failCount > 0) {
      if (successCount > 0) {
        toast.info(`알림 전송 완료: 성공 ${successCount}건, 실패 ${failCount}건`);
      } else {
        toast.error(`알림 전송 실패: ${failCount}건`);
      }
    } else {
      toast.success(`알림 전송 완료: ${successCount}건`);
    }

    // 알림 통계 업데이트 (대량 생성인 경우 전체 갱신, 소량인 경우 증분 업데이트)
    try {
      if (successCount > 100) {
        // 대량 알림 생성 시 전체 통계 갱신
        await refreshNotificationAggregate();
      } else if (successCount > 0) {
        // 알림 유형과 대상 역할 정보 추출
        let targetRole = '';

        if (target.type === 'role') {
          targetRole = typeof target.value === 'string' ? target.value : 'multiple';
        } else {
          // 타겟이 여러 유저인 경우 너무 복잡하므로 전체 갱신
          await refreshNotificationAggregate();
        }

        if (targetRole && targetRole !== 'multiple' && targetRole !== 'all') {
          // 단일 역할에 대한 알림 전송인 경우 증분 업데이트 시도
          for (let i = 0; i < successCount; i++) {
            await incrementNotificationAggregate(
              notificationData.type,
              targetRole
            );
          }
        }
      }
    } catch (statsError) {
      
      // 통계 업데이트 실패는 알림 생성 성공 여부에 영향을 주지 않음
    }

    return successCount > 0;
  } catch (error: any) {
    
    return false;
  }
};