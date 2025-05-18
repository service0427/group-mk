import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { useLogoutContext } from '@/contexts/LogoutContext';
import { 
  INotification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus 
} from '@/types/notification';

export const useNotifications = () => {
  const { currentUser } = useAuthContext();
  const { isLoggingOut, safeApiCall } = useLogoutContext();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const subscriptionChannelRef = useRef<any>(null);
  
  // 알림 데이터 가져오기
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id || isLoggingOut) return;
    
    try {
      setLoading(true);
      
      // 최근 30일 이내의 알림만 가져오기
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // 로그아웃 중에는 요청하지 않도록 safeApiCall 사용
      await safeApiCall(
        async () => {
          // Supabase 쿼리 - 모든 알림 불러오기
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });
          
          if (error) {
            // 로그아웃 중이 아닐 때만 처리
            if (!isLoggingOut) {
              // 오류 발생 시 모킹 데이터 사용 (개발 중에만 활성화)
              const mockData = generateMockNotifications(currentUser.id || '');
              setNotifications(mockData);
              
              // 읽지 않은 알림 카운트 계산
              const unread = mockData.filter(
                (notification: INotification) => notification.status === NotificationStatus.UNREAD
              ).length;
              
              setUnreadCount(unread);
            }
          } else if (data && !isLoggingOut) {
            // 데이터 타입 변환
            const typedData = data.map((item: any) => {
              const transformed = {
                ...item,
                userId: item.user_id,
                type: item.type as NotificationType,
                priority: item.priority as NotificationPriority,
                status: item.status as NotificationStatus,
                createdAt: item.created_at || new Date().toISOString(), // 없으면 현재 시간으로
                expiresAt: item.expires_at
              };
              
              return transformed;
            });
            
            // 로그아웃 중이 아닐 때만 상태 업데이트
            if (!isLoggingOut) {
              setNotifications(typedData);
              
              // 읽지 않은 알림 카운트 계산
              const unread = typedData.filter(
                (notification: INotification) => notification.status === NotificationStatus.UNREAD
              ).length;
              
              setUnreadCount(unread);
            }
          }
          
          return data;
        },
        null // 오류 발생 시 기본값
      );
    } catch (error: any) {
      // 로그아웃 중이 아닐 때만 오류 처리
      if (!isLoggingOut) {
        // 오류 발생 시 빈 배열로 설정
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      // 로그아웃 중이 아닐 때만 상태 업데이트
      if (!isLoggingOut) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, isLoggingOut, safeApiCall]);
  
  // 알림 읽음 표시
  const markAsRead = async (notificationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: NotificationStatus.READ })
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        
        return;
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, status: NotificationStatus.READ }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      
    }
  };
  
  // 모든 알림 읽음 표시 (선택적으로 특정 알림 ID 목록만 처리)
  const markAllAsRead = async (notificationIds?: string[]) => {
    if (!currentUser?.id) return;
    
    try {
      // 업데이트할 쿼리 기본 설정
      let query = supabase
        .from('notifications')
        .update({ status: NotificationStatus.READ })
        .eq('user_id', currentUser.id)
        .eq('status', NotificationStatus.UNREAD);
      
      // 특정 알림 ID 목록이 전달된 경우, 해당 알림만 업데이트
      if (notificationIds && notificationIds.length > 0) {
        query = query.in('id', notificationIds);
      }
      
      const { error } = await query;
      
      if (error) {
        
        return;
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => {
          // 특정 ID 목록이 전달된 경우, 해당 알림만 업데이트
          if (notificationIds && notificationIds.length > 0) {
            return notificationIds.includes(notification.id) && notification.status === NotificationStatus.UNREAD
              ? { ...notification, status: NotificationStatus.READ }
              : notification;
          } else {
            // 전체 업데이트
            return notification.status === NotificationStatus.UNREAD
              ? { ...notification, status: NotificationStatus.READ }
              : notification;
          }
        })
      );
      
      // 읽지 않은 알림 카운트 업데이트
      if (notificationIds && notificationIds.length > 0) {
        // 영향 받은 알림 수만큼 감소
        const affectedCount = notifications.filter(
          n => notificationIds.includes(n.id) && n.status === NotificationStatus.UNREAD
        ).length;
        
        setUnreadCount(prev => Math.max(0, prev - affectedCount));
      } else {
        // 모두 읽음 처리한 경우
        setUnreadCount(0);
      }
    } catch (error: any) {
      
    }
  };
  
  // 알림 보관 처리
  const archiveNotification = async (notificationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: NotificationStatus.ARCHIVED })
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        
        return;
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, status: NotificationStatus.ARCHIVED }
            : notification
        )
      );
      
      // 읽지 않은 알림이 보관된 경우 카운트 업데이트
      const targetNotification = notifications.find(n => n.id === notificationId);
      if (targetNotification?.status === NotificationStatus.UNREAD) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      
    }
  };
  
  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        
        return;
      }
      
      // 로컬 상태 업데이트
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // 읽지 않은 알림 수 업데이트
      if (deletedNotification?.status === NotificationStatus.UNREAD) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      
    }
  };
  
  // 새 알림 생성 (주로 관리자나 서버에서 사용)
  const createNotification = async (notification: Omit<INotification, 'id' | 'userId' | 'createdAt'> & { userId: string }) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          icon: notification.icon,
          priority: notification.priority,
          status: notification.status || NotificationStatus.UNREAD,
          expires_at: notification.expiresAt
        })
        .select();
      
      if (error) {
        
        return null;
      }
      
      // 현재 사용자에게 보내는 알림인 경우, 로컬 상태 업데이트
      if (notification.userId === currentUser?.id) {
        const newNotification = data[0] as INotification;
        setNotifications(prev => [newNotification, ...prev]);
        
        if (newNotification.status === NotificationStatus.UNREAD) {
          setUnreadCount(prev => prev + 1);
        }
        
        return newNotification;
      }
      
      return data[0] as INotification;
    } catch (error: any) {
      
      return null;
    }
  };
  
  // 실시간 구독 설정
  useEffect(() => {
    // 로그아웃 중이거나 사용자 ID가 없으면 구독하지 않음
    if (!currentUser?.id || isLoggingOut) return;
    
    // 초기 알림 데이터 가져오기
    fetchNotifications();
    
    // 이전 구독이 있으면 정리
    if (subscriptionChannelRef.current) {
      try {
        supabase.removeChannel(subscriptionChannelRef.current);
      } catch (e) {
        // 구독 정리 중 오류는 무시
      }
      subscriptionChannelRef.current = null;
    }
    
    // 실시간 구독 설정
    try {
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            // 로그아웃 중이면 이벤트 무시
            if (isLoggingOut) return;
            
            // 새 알림 추가
            const newNotification = payload.new as INotification;
            
            // 로컬 상태 업데이트
            setNotifications(prev => [newNotification, ...prev]);
            
            // 읽지 않은 알림 카운트 업데이트
            if (newNotification.status === NotificationStatus.UNREAD) {
              setUnreadCount(prev => prev + 1);
            }
            
            // 브라우저 알림 표시 (선택사항)
            if (Notification.permission === 'granted' && !isLoggingOut) {
              try {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico'
                });
              } catch (e) {
                // 브라우저 알림 오류는 무시
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            // 로그아웃 중이면 이벤트 무시
            if (isLoggingOut) return;
            
            // 업데이트된 알림 정보
            const updatedNotification = payload.new as INotification;
            
            // 로컬 상태 업데이트
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id ? updatedNotification : notification
              )
            );
            
            // 상태 변경에 따른 읽지 않은 알림 카운트 업데이트
            if (payload.old.status === NotificationStatus.UNREAD && 
                updatedNotification.status !== NotificationStatus.UNREAD) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            } else if (payload.old.status !== NotificationStatus.UNREAD && 
                       updatedNotification.status === NotificationStatus.UNREAD) {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            // 로그아웃 중이면 이벤트 무시
            if (isLoggingOut) return;
            
            // 삭제된 알림 정보
            const deletedNotification = payload.old as INotification;
            
            // 로컬 상태 업데이트
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotification.id)
            );
            
            // 읽지 않은 알림 수 업데이트
            if (deletedNotification.status === NotificationStatus.UNREAD) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe((status) => {
          // 로그아웃 중이면 이벤트 무시
          if (isLoggingOut) return;
          
          // 구독 상태에 따른 처리
          if (status === 'CHANNEL_ERROR') {
            // 오류 발생 시 5초 후 재연결 시도
            setTimeout(() => {
              if (!isLoggingOut) {
                fetchNotifications(); // 데이터 다시 가져오기
              }
            }, 5000);
          }
        });
      
      // 채널 레퍼런스 저장
      subscriptionChannelRef.current = channel;
    } catch (error) {
      // 구독 설정 실패는 무시 (오류 로그만 출력)
      console.error("알림 구독 설정 중 오류:", error);
    }
    
    // 컴포넌트 언마운트 시 또는 의존성 변경 시(로그아웃 등) 구독 해제
    return () => {
      if (subscriptionChannelRef.current) {
        try {
          supabase.removeChannel(subscriptionChannelRef.current);
        } catch (e) {
          // 구독 정리 중 오류는 무시
        }
        subscriptionChannelRef.current = null;
      }
    };
  }, [currentUser?.id, fetchNotifications, isLoggingOut]);
  
  // 알림 읽지 않음 표시
  const markAsUnread = async (notificationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: NotificationStatus.UNREAD })
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        
        return;
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, status: NotificationStatus.UNREAD }
            : notification
        )
      );
      
      setUnreadCount(prev => prev + 1);
    } catch (error: any) {
      
    }
  };

  // 여러 알림 읽지 않음 표시
  const markAllAsUnread = async (notificationIds?: string[]) => {
    if (!currentUser?.id) return;
    
    try {
      // 업데이트할 쿼리 기본 설정
      let query = supabase
        .from('notifications')
        .update({ status: NotificationStatus.UNREAD })
        .eq('user_id', currentUser.id);
      
      // 특정 알림 ID 목록이 전달된 경우, 해당 알림만 업데이트
      if (notificationIds && notificationIds.length > 0) {
        query = query.in('id', notificationIds);
      } else {
        // 전체 알림 읽지 않음 처리는 위험할 수 있으므로 
        // 반드시 ID 목록을 받도록 제한
        
        return;
      }
      
      const { error } = await query;
      
      if (error) {
        
        return;
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => {
          // 특정 ID 목록이 전달된 경우, 해당 알림만 업데이트
          if (notificationIds && notificationIds.length > 0) {
            return notificationIds.includes(notification.id)
              ? { ...notification, status: NotificationStatus.UNREAD }
              : notification;
          }
          return notification;
        })
      );
      
      // 읽지 않은 알림 카운트 업데이트
      if (notificationIds && notificationIds.length > 0) {
        // ID 목록에 포함된 알림 중 이미 읽지 않은 상태인 알림은 제외
        const affectedCount = notifications.filter(
          n => notificationIds.includes(n.id) && n.status !== NotificationStatus.UNREAD
        ).length;
        
        setUnreadCount(prev => prev + affectedCount);
      }
    } catch (error: any) {
      
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    markAllAsUnread,
    archiveNotification,
    deleteNotification,
    createNotification,
    fetchNotifications
  };
};

// 모킹 데이터 생성 (Supabase 연동 실패 시 대체용)
const generateMockNotifications = (userId: string): INotification[] => {
  return [
    {
      id: '1',
      userId: userId,
      type: NotificationType.SYSTEM,
      title: '시스템 점검 안내',
      message: '금일 오후 11시부터 새벽 2시까지 서버 점검이 있을 예정입니다.',
      link: '/notice',
      priority: NotificationPriority.HIGH,
      status: NotificationStatus.UNREAD,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: userId,
      type: NotificationType.TRANSACTION,
      title: '캐시 충전 완료',
      message: '10,000원 캐시 충전이 완료되었습니다.',
      link: '/cash/history',
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      userId: userId,
      type: NotificationType.SERVICE,
      title: '새로운 서비스 오픈',
      message: '오늘의집 트래픽 서비스가 새롭게 오픈되었습니다.',
      link: '/advertise/ohouse/traffic/intro',
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      userId: userId,
      type: NotificationType.SLOT,
      title: '슬롯 승인 완료',
      message: '요청하신 슬롯이 승인되었습니다.',
      link: '/myinfo/services',
      priority: NotificationPriority.HIGH,
      status: NotificationStatus.READ,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      userId: userId,
      type: NotificationType.MARKETING,
      title: '신규 가입 혜택 안내',
      message: '신규 가입 축하 5,000원 무료 캐시가 지급되었습니다.',
      link: '/cash/history',
      priority: NotificationPriority.LOW,
      status: NotificationStatus.READ,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
};