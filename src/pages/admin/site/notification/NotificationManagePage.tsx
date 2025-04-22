import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import { supabase, supabaseAdmin } from '@/supabase';
import {
  INotification,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner'; // toast 라이브러리 가져오기
import NotificationIcon from '@/components/notifications/NotificationIcon';
import SendNotificationModal from './components/SendNotificationModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import NotificationStatsCard from './components/NotificationStatsCard';
import UserSelectModal from './components/UserSelectModal';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { KeenIcon } from '@/components/keenicons';
import { ScreenLoader } from '@/components/loaders';

const NotificationManagePage: React.FC = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  const { currentUser, loading: authLoading } = useAuthContext();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    byType: Record<NotificationType, number>;
    byUserRole: Record<string, number>;
    byStatus: Record<NotificationStatus, number>;
  }>({
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

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(30); // 페이지당 30개 항목 기본값

  // 모달 상태
  const [showSendModal, setShowSendModal] = useState(false);
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedNotificationType, setSelectedNotificationType] = useState<'role' | 'user'>('role');
  const [deleteOption, setDeleteOption] = useState<{
    type: 'selected' | 'older' | 'all';
    ids?: string[];
    olderThan?: Date;
  } | null>(null);

  // 알림 필터링 상태
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterUserRole, setFilterUserRole] = useState<string | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string, name: string }[]>([]);

  // 관리자 권한 체크
  const isAdmin = currentUser?.role === 'developer' || currentUser?.role === 'operator';

  // 알림 데이터 가져오기
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
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
        console.error('알림 개수 조회 중 오류 발생:', countError.message);
        toast.error('알림 정보를 불러오는데 실패했습니다.');
        setLoading(false);
        return;
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
        console.error('상태별 알림 수 조회 중 오류 발생:', error);
      }
      
      // 페이지네이션 정보 계산
      const total = count || 0;
      const pages = Math.ceil(total / itemsPerPage);
      
      setTotalCount(total);
      setTotalPages(pages || 1);
      
      // 페이지 범위 확인
      const validPage = Math.min(Math.max(1, page), pages || 1);
      if (validPage !== page) {
        setCurrentPage(validPage);
        page = validPage;
      }
      
      // 페이지네이션 적용 데이터 조회
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      dataQuery = dataQuery
        .range(from, to);
      
      const { data, error } = await dataQuery;
      
      if (error) {
        console.error('알림을 가져오는 중 오류 발생:', error.message);
        toast.error('알림 데이터를 불러오는데 실패했습니다.');
        setLoading(false);
        return;
      }
      
      // 데이터가 없는 경우 빈 배열 처리
      if (!data || data.length === 0) {
        setNotifications([]);
        updateStats([], statusCounts);
        setLoading(false);
        return;
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
          setNotifications(filteredData);
          
          // 역할 필터링에 따라 통계 업데이트 및 페이지네이션 재계산
          if (filteredData.length < typedData.length) {
            const filteredPages = Math.ceil(filteredData.length / itemsPerPage);
            setTotalPages(filteredPages || 1);
            setTotalCount(filteredData.length);
            
            // 현재 페이지가 새 총 페이지 수보다 크면 첫 페이지로 리셋
            if (currentPage > filteredPages) {
              setCurrentPage(1);
            }
          }
          
          updateStats(filteredData, statusCounts);
        } else {
          setNotifications(typedData);
          
          // 전체 통계 업데이트는 서버에서 받은 total 기준으로
          // updateStats는 현재 페이지 데이터로 사용
          updateStats(typedData, statusCounts);
        }
      } catch (userError) {
        console.error('사용자 정보 조회 중 오류 발생:', userError);
        
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
        
        setNotifications(basicTypedData);
        updateStats(basicTypedData, statusCounts);
      }
    } catch (error: any) {
      console.error('알림을 가져오는 중 오류 발생:', error.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterUserRole, currentPage, itemsPerPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 선택된 항목 초기화
    setSelectedItems([]);
  };
  
  // 페이지당 표시 개수 변경 핸들러
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // 알림 통계 계산
  const updateStats = (notificationData: INotification[], statusCounts: Record<NotificationStatus, number>) => {
    const typeCount = {
      [NotificationType.SYSTEM]: 0,
      [NotificationType.TRANSACTION]: 0,
      [NotificationType.SERVICE]: 0,
      [NotificationType.SLOT]: 0,
      [NotificationType.MARKETING]: 0,
    };
    
    const roleCount = {
      'developer': 0,
      'operator': 0,
      'distributor': 0,
      'agency': 0,
      'advertiser': 0,
    };
    
    notificationData.forEach(notification => {
      // 타입별 카운트
      if (typeCount[notification.type] !== undefined) {
        typeCount[notification.type]++;
      }
      
      // 사용자 역할별 카운트
      const userRole = (notification as any).userRole;
      if (userRole && roleCount[userRole] !== undefined) {
        roleCount[userRole]++;
      }
    });
    
    setStats({
      total: totalCount, // 전체 개수는 서버에서 받은 totalCount 사용
      byType: typeCount,
      byUserRole: roleCount,
      byStatus: statusCounts
    });
  };

  // 필터 적용 핸들러
  const handleApplyFilter = () => {
    setCurrentPage(1); // 필터 적용 시 첫 페이지로 이동
    fetchNotifications(1);
  };

  // 알림 삭제 함수 - 배치 처리 및 Soft Delete 적용
  const deleteNotifications = async (options: {
    type: 'selected' | 'older' | 'all';
    ids?: string[];
    olderThan?: Date;
  }) => {
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
          console.error('알림 개수 조회 중 오류 발생:', error.message);
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
          console.error('알림 개수 조회 중 오류 발생:', error.message);
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
              console.error(`배치 ${i / batchSize + 1} 아카이브 중 오류 발생:`, error.message);
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
            console.error('알림 아카이브 중 오류 발생:', error.message);
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
              console.error(`배치 ${i / batchSize + 1} 삭제 중 오류 발생:`, error.message);
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
            console.error('알림 삭제 중 오류 발생:', error.message);
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
              console.error('알림 ID 조회 중 오류 발생:', idError.message);
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
                console.error(`배치 ${i / batchSize + 1} 삭제 중 오류 발생:`, deleteError.message);
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
            console.error('전체 알림 삭제 중 오류 발생:', error.message);
            toast.dismiss();
            toast.error(`전체 알림 삭제 중 오류 발생: ${error.message}`);
            return false;
          }
        }
      }
      
      // 3. 작업 완료 메시지 표시
      toast.dismiss();
      toast.success(`알림 처리 완료: ${processedCount}개`);
      
      // 성공적으로 삭제된 경우 알림 목록 다시 가져오기
      await fetchNotifications(1); // 첫 페이지로 이동
      return true;
    } catch (error: any) {
      console.error('알림 삭제 중 오류 발생:', error.message);
      toast.dismiss();
      toast.error(`알림 삭제 중 오류 발생: ${error.message}`);
      return false;
    }
  };
  
  // 다중 알림 생성 함수 (역할별 또는 특정 사용자에게) - 배치 처리 적용
  const createMultipleNotifications = async (
    notificationData: Omit<INotification, 'id' | 'userId' | 'createdAt'>,
    target: { type: 'role' | 'user', value: string | string[] }
  ) => {
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
          console.error('사용자 ID 조회 중 오류 발생:', error.message);
          toast.error('사용자 ID 조회 중 오류가 발생했습니다.');
          return false;
        }
        
        userIds = data.map(user => user.id);
      } else if (target.type === 'user') {
        // 특정 사용자 ID 배열 사용
        userIds = Array.isArray(target.value) ? target.value : [target.value];
      }
      
      if (userIds.length === 0) {
        console.error('알림을 보낼 사용자가 없습니다.');
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
          try {
            // 관리자 권한으로 알림 생성 시도 (RLS 정책 우회 확인)
            console.log('알림 전송 시도 - 관리자 클라이언트 사용');
            
            // 커스텀 헤더를 추가하여 명시적으로 서비스 롤 설정
            const { error } = await supabaseAdmin
              .from('notifications')
              .insert(notificationsToInsert)
              .select(); // select를 추가하여 응답 확인
            
            if (error) {
              console.error('supabaseAdmin 삽입 오류:', error);
              
              // RLS 오류 발생 시 대체 방식 시도 (직접 헤더 설정)
              if (error.message.includes('row-level security')) {
                console.log('RLS 우회 실패, 대체 방식 시도...');
                
                // 직접 서비스 롤 키를 헤더에 명시적으로 지정하는 방식 시도
                const { error: retryError } = await supabase
                  .from('notifications')
                  .insert(notificationsToInsert, {
                    headers: {
                      'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
                      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`
                    }
                  });
                
                if (retryError) {
                  console.error('대체 방식도 실패:', retryError);
                  throw retryError;
                } else {
                  console.log('대체 방식 성공!');
                  successCount += batch.length;
                }
              } else {
                throw error;
              }
            } else {
              console.log('알림 전송 성공!');
              // 성공 처리
              successCount += batch.length;
            }
          } catch (err: any) {
            console.error(`배치 ${i / batchSize + 1} 처리 중 오류 발생:`, err.message);
            toast.error(`알림 전송 중 오류: ${err.message}`);
            // 실패 처리
            failCount += batch.length;
          }
          
          // 진행 상태 업데이트
          toast.loading(`알림 전송 중... (${Math.min(i + batchSize, userIds.length)}/${userIds.length})`);
        } catch (error: any) {
          console.error(`배치 ${i / batchSize + 1} 처리 중 오류 발생:`, error.message);
          failCount += batch.length;
        }
        
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
      
      // 알림 목록 새로고침
      await fetchNotifications(1); // 첫 페이지로 이동
      return successCount > 0;
    } catch (error: any) {
      console.error('알림 생성 중 오류 발생:', error.message);
      return false;
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (isAdmin) {
      fetchNotifications(currentPage);
    }
  }, [fetchNotifications, isAdmin, currentPage, itemsPerPage]);

  // 선택된 항목 변경 핸들러
  const handleSelectionChange = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 모든 항목 선택/해제 핸들러
  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedItems(notifications.map(notification => notification.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch (error) {
      return '날짜 없음';
    }
  };

  // 알림 타입 표시 텍스트
  const getNotificationTypeText = (type: NotificationType) => {
    switch(type) {
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

  // 알림 전송 모달 열기 핸들러
  const handleOpenSendModal = (type: 'role' | 'user') => {
    setSelectedNotificationType(type);
    
    if (type === 'user') {
      setShowUserSelectModal(true);
    } else {
      setShowSendModal(true);
    }
  };

  // 사용자 선택 완료 핸들러
  const handleUserSelectComplete = (users: { id: string, name: string }[]) => {
    setSelectedUsers(users);
    setShowUserSelectModal(false);
    setShowSendModal(true);
  };

  // 알림 전송 처리 핸들러
  const handleSendNotification = async (notificationData: Omit<INotification, 'id' | 'userId' | 'createdAt'>) => {
    let success = false;
    
    if (selectedNotificationType === 'role') {
      // 역할별 알림 전송
      const selectedRole = document.getElementById('targetRole') as HTMLSelectElement;
      if (!selectedRole?.value) return;
      
      success = await createMultipleNotifications(
        notificationData,
        { type: 'role', value: selectedRole.value === 'all' ? 'all' : selectedRole.value }
      );
    } else if (selectedNotificationType === 'user') {
      // 특정 사용자에게 알림 전송
      if (selectedUsers.length === 0) return;
      
      success = await createMultipleNotifications(
        notificationData,
        { type: 'user', value: selectedUsers.map(user => user.id) }
      );
    }

    if (success) {
      toast.success('알림이 성공적으로 전송되었습니다.');
      setShowSendModal(false);
      setSelectedUsers([]);
    } else {
      toast.error('알림 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 알림 삭제 확인 모달 열기 핸들러
  const handleOpenDeleteConfirmModal = (option: {
    type: 'selected' | 'older' | 'all';
    ids?: string[];
    olderThan?: Date;
  }) => {
    setDeleteOption(option);
    setShowDeleteConfirmModal(true);
  };

  // 알림 삭제 실행 핸들러
  const handleDeleteConfirmed = async () => {
    if (!deleteOption) return;
    
    const success = await deleteNotifications(deleteOption);
    if (success) {
      toast.success('알림이 성공적으로 삭제되었습니다.');
      setSelectedItems([]);
    } else {
      toast.error('알림 삭제에 실패했습니다. 다시 시도해주세요.');
    }
    
    setShowDeleteConfirmModal(false);
    setDeleteOption(null);
  };

  // 페이지네이션 컴포넌트
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    // 현재 표시 범위 계산
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalCount);
    
    return (
      <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">페이지당 표시:</span>
          <select
            className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-1 min-w-[100px] w-auto"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          {totalCount > 0 ? (
            <>총 <span className="font-medium text-gray-800 dark:text-gray-300">{totalCount}</span>개 항목 중 <span className="font-medium text-gray-800 dark:text-gray-300">{start}</span>-<span className="font-medium text-gray-800 dark:text-gray-300">{end}</span>번</>
          ) : (
            '표시할 항목이 없습니다'
          )}
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <KeenIcon icon="double-left" className="fs-7" />
          </button>
          
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <KeenIcon icon="arrow-left" className="fs-7" />
          </button>
          
          <div className="flex items-center">
            {(() => {
              // 페이지 번호 계산 로직
              const totalPages = getTotalPages();
              const maxPagesToShow = 5;
              let startPage: number;
              let endPage: number;
              
              if (totalPages <= maxPagesToShow) {
                // 전체 페이지가 5개 이하면 모두 표시
                startPage = 1;
                endPage = totalPages;
              } else if (currentPage <= 3) {
                // 현재 페이지가 앞쪽에 있을 경우
                startPage = 1;
                endPage = 5;
              } else if (currentPage >= totalPages - 2) {
                // 현재 페이지가 뒷쪽에 있을 경우
                startPage = totalPages - 4;
                endPage = totalPages;
              } else {
                // 현재 페이지가 중간에 있을 경우
                startPage = currentPage - 2;
                endPage = currentPage + 2;
              }
              
              // 페이지 버튼 배열 생성
              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button 
                    key={i} 
                    className={`flex items-center justify-center w-8 h-8 rounded-md ${
                      i === currentPage 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </button>
                );
              }
              
              return pages;
            })()}
          </div>
          
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= getTotalPages()}
          >
            <KeenIcon icon="arrow-right" className="fs-7" />
          </button>
          
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            onClick={() => handlePageChange(getTotalPages())}
            disabled={currentPage === getTotalPages()}
          >
            <KeenIcon icon="double-right" className="fs-7" />
          </button>
        </div>
      </div>
    );
  };
  
  // 총 페이지 수 계산
  const getTotalPages = () => {
    return Math.max(1, Math.ceil(totalCount / itemsPerPage));
  };

  // 관리자 권한 체크 및 로딩 화면
  if (authLoading) {
    return <ScreenLoader />;
  }

  // 관리자가 아니면 메인 페이지로 리디렉션
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="알림 관리" />
            <ToolbarDescription>관리자 메뉴 &gt; 사이트 관리 &gt; 알림 관리</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          <div className="bg-card rounded-lg shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-card-foreground">알림 관리</h3>
              <div className="flex gap-3">
                <button
                  className="btn btn-primary"
                  onClick={() => handleOpenSendModal('role')}
                >
                  <KeenIcon icon="briefcase" className="me-2" />
                  권한별 알림 전송
                </button>
                <button
                  className="btn btn-info"
                  onClick={() => handleOpenSendModal('user')}
                >
                  <KeenIcon icon="user" className="me-2" />
                  회원별 알림 전송
                </button>
              </div>
            </div>

            {/* 알림 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <NotificationStatsCard 
                title="알림 개수 정보" 
                data={[
                  { label: '전체', value: stats.total },
                  { label: '읽지 않음', value: stats.byStatus[NotificationStatus.UNREAD] },
                  { label: '읽음', value: stats.byStatus[NotificationStatus.READ] },
                  { label: '보관됨', value: stats.byStatus[NotificationStatus.ARCHIVED] }
                ]}
                icon="notification"
              />
              <NotificationStatsCard 
                title="알림 타입별 분포" 
                data={Object.entries(stats.byType).map(([key, value]) => ({
                  label: getNotificationTypeText(key as NotificationType),
                  value
                }))}
                icon="abstract-28" 
              />
              <NotificationStatsCard 
                title="회원 유형별 분포" 
                data={Object.entries(stats.byUserRole).map(([key, value]) => ({
                  label: key === 'developer' ? '개발자' : 
                        key === 'operator' ? '운영자' :
                        key === 'distributor' ? '총판' :
                        key === 'agency' ? '대행사' :
                        key === 'advertiser' ? '광고주' : key,
                  value
                }))}
                icon="briefcase" 
              />
            </div>

            {/* 필터 및 삭제 액션 */}
            <div className="flex flex-wrap justify-between items-center mb-5 gap-4 border-t border-b py-4 border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-3">
                <select
                  className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-2 min-w-[160px] w-auto"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                >
                  <option value="all">모든 알림 유형</option>
                  <option value={NotificationType.SYSTEM}>시스템</option>
                  <option value={NotificationType.TRANSACTION}>결제/캐시</option>
                  <option value={NotificationType.SERVICE}>서비스</option>
                  <option value={NotificationType.SLOT}>슬롯</option>
                  <option value={NotificationType.MARKETING}>마케팅</option>
                </select>
                
                <select
                  className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-2 min-w-[160px] w-auto"
                  value={filterUserRole}
                  onChange={(e) => setFilterUserRole(e.target.value)}
                >
                  <option value="all">모든 회원 유형</option>
                  <option value="developer">개발자</option>
                  <option value="operator">운영자</option>
                  <option value="distributor">총판</option>
                  <option value="agency">대행사</option>
                  <option value="advertiser">광고주</option>
                </select>
                
                <button
                  className="btn btn-sm btn-light-primary"
                  onClick={() => handleApplyFilter()}
                >
                  <KeenIcon icon="filter" className="me-1" />
                  필터 적용
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  className={`btn btn-sm ${selectedItems.length > 0 ? 'btn-danger' : 'btn-light-secondary opacity-75 cursor-not-allowed'}`}
                  disabled={selectedItems.length === 0}
                  onClick={() => handleOpenDeleteConfirmModal({ type: 'selected', ids: selectedItems })}
                >
                  <KeenIcon icon="trash" className="me-1" />
                  선택 항목 삭제 ({selectedItems.length})
                </button>
                
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 30); // 30일 이전
                    handleOpenDeleteConfirmModal({ 
                      type: 'older', 
                      olderThan: date 
                    });
                  }}
                >
                  <KeenIcon icon="calendar-tick" className="me-1" />
                  30일 이전 알림 삭제
                </button>
                
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleOpenDeleteConfirmModal({ type: 'all' })}
                >
                  <KeenIcon icon="trash-square" className="me-1" />
                  전체 알림 삭제
                </button>
              </div>
            </div>

            {/* 알림 목록 테이블 */}
            <div className="card card-bordered">
              <div className="table-responsive">
                <table className="table table-rounded table-striped border gy-7 gs-7">
                  <thead>
                    <tr className="fw-bold fs-6 text-gray-800 border-bottom border-gray-200 dark:text-gray-300 dark:border-gray-700">
                      <th style={{ width: '25px' }}>
                        <div className="form-check form-check-custom form-check-solid me-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedItems.length === notifications.length && notifications.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </div>
                      </th>
                      <th>타입</th>
                      <th>제목</th>
                      <th>내용</th>
                      <th>받는 회원</th>
                      <th>회원 유형</th>
                      <th>날짜</th>
                      <th>상태</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center">
                          <div className="d-flex justify-content-center align-items-center column-gap-2">
                            <span className="spinner-border spinner-border-sm text-primary"></span>
                          </div>
                          <div className="mt-2 text-gray-600">알림을 불러오는 중...</div>
                        </td>
                      </tr>
                    ) : notifications.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-gray-500">
                          알림이 없습니다
                        </td>
                      </tr>
                    ) : (
                      notifications.map(notification => (
                        <tr key={notification.id}>
                          <td>
                            <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedItems.includes(notification.id)}
                                onChange={() => handleSelectionChange(notification.id)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <NotificationIcon type={notification.type} size="sm" />
                              <span className={`badge ms-2 ${
                                notification.type === NotificationType.SYSTEM 
                                  ? 'badge-light-primary' 
                                : notification.type === NotificationType.TRANSACTION 
                                  ? 'badge-light-success'
                                : notification.type === NotificationType.SERVICE
                                  ? 'badge-light-info'
                                : notification.type === NotificationType.SLOT
                                  ? 'badge-light-warning'
                                : notification.type === NotificationType.MARKETING
                                  ? 'badge-light-danger'
                                : 'badge-light-secondary'
                              }`}>
                                {getNotificationTypeText(notification.type)}
                              </span>
                            </div>
                          </td>
                          <td>{notification.title}</td>
                          <td>
                            <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {notification.message}
                            </div>
                          </td>
                          <td className="text-gray-900 dark:text-gray-300">{(notification as any).userName || '알 수 없음'}</td>
                          <td>
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                              (notification as any).userRole === 'developer' 
                                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' 
                              : (notification as any).userRole === 'operator' 
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                              : (notification as any).userRole === 'distributor'
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                              : (notification as any).userRole === 'agency'
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
                              : (notification as any).userRole === 'advertiser'
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                            }`}>
                              {(notification as any).userRole === 'developer' 
                                ? '개발자' 
                              : (notification as any).userRole === 'operator' 
                                ? '운영자'
                              : (notification as any).userRole === 'distributor'
                                ? '총판'
                              : (notification as any).userRole === 'agency'
                                ? '대행사'
                              : (notification as any).userRole === 'advertiser'
                                ? '광고주'
                              : (notification as any).userRole || '기타'}
                            </span>
                          </td>
                          <td>{formatDate(notification.createdAt)}</td>
                          <td>
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                              notification.status === NotificationStatus.UNREAD 
                                ? 'bg-blue-50 text-blue-600' 
                              : notification.status === NotificationStatus.READ 
                                ? 'bg-gray-50 text-gray-500'
                              : 'bg-purple-50 text-purple-600'
                            }`}>
                              {notification.status === NotificationStatus.UNREAD 
                                ? '읽지 않음' 
                              : notification.status === NotificationStatus.READ 
                                ? '읽음'
                              : '보관됨'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-icon btn-sm btn-light-danger"
                              onClick={() => handleOpenDeleteConfirmModal({ 
                                type: 'selected', 
                                ids: [notification.id] 
                              })}
                            >
                              <KeenIcon icon="trash" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* 페이지네이션 */}
              {renderPagination()}
              
            </div>

            {/* 알림 관리 안내 */}
            <div className="bg-card rounded-lg shadow-sm p-5 mt-5">
              <h3 className="text-lg font-medium text-card-foreground mb-4">알림 관리 안내</h3>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>• <span className="font-medium">권한별 알림 전송</span>: 개발자, 운영자, 총판, 대행사, 광고주 등 특정 권한을 가진 모든 회원에게 알림을 전송합니다.</p>
                <p>• <span className="font-medium">회원별 알림 전송</span>: 특정 회원을 선택하여 알림을 전송합니다.</p>
                <p>• <span className="font-medium">알림 삭제 기능</span>: 테이블 용량 관리를 위해 특정 기간이 지난 알림을 일괄 삭제할 수 있습니다.</p>
                <p>• <span className="font-medium">알림 타입</span>: 시스템, 결제/캐시, 서비스, 슬롯, 마케팅 등 다양한 유형의 알림을 전송할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 모달 컴포넌트들 */}
      {showSendModal && (
        <SendNotificationModal
          onClose={() => {
            setShowSendModal(false);
            setSelectedUsers([]);
          }}
          onSend={handleSendNotification}
          notificationType={selectedNotificationType}
          selectedUsers={selectedUsers}
        />
      )}
      
      {showUserSelectModal && (
        <UserSelectModal
          onClose={() => setShowUserSelectModal(false)}
          onSelectComplete={handleUserSelectComplete}
        />
      )}
      
      {showDeleteConfirmModal && deleteOption && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirmModal}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setDeleteOption(null);
          }}
          onConfirm={handleDeleteConfirmed}
          title={
            deleteOption.type === 'selected' 
              ? '선택한 알림 삭제' 
            : deleteOption.type === 'older' 
              ? '오래된 알림 삭제'
            : '전체 알림 삭제'
          }
          message={
            deleteOption.type === 'selected' 
              ? `선택한 ${deleteOption.ids?.length || 0}개의 알림을 삭제하시겠습니까?` 
            : deleteOption.type === 'older' 
              ? `${formatDate(deleteOption.olderThan || new Date())} 이전의 모든 알림을 삭제하시겠습니까?`
            : '모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
          }
        />
      )}
    </>
  );
};

export default NotificationManagePage;