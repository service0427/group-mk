import { supabase } from '@/supabase';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus 
} from '@/types/notification';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  icon?: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  expiresAt?: Date;
}

/**
 * 단일 사용자에게 알림 생성
 */
export const createNotification = async (params: CreateNotificationParams) => {
  const { 
    userId, 
    type, 
    title, 
    message, 
    link, 
    icon, 
    priority = NotificationPriority.MEDIUM,
    status = NotificationStatus.UNREAD,
    expiresAt 
  } = params;
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        icon,
        priority,
        status,
        expires_at: expiresAt?.toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('알림 생성 중 오류 발생:', error.message);
      return null;
    }
    
    return data;
  } catch (error: any) {
    console.error('알림 생성 중 오류 발생:', error.message);
    return null;
  }
};

/**
 * 여러 사용자에게 동일한 알림 생성
 */
export const createBulkNotifications = async (
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) => {
  if (!userIds.length) return false;
  
  const { 
    type, 
    title, 
    message, 
    link, 
    icon, 
    priority = NotificationPriority.MEDIUM,
    status = NotificationStatus.UNREAD,
    expiresAt 
  } = params;
  
  try {
    // 배열로 사용자별 알림 데이터 생성
    const notificationsToInsert = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      link,
      icon,
      priority,
      status,
      expires_at: expiresAt?.toISOString()
    }));
    
    // 대량 삽입
    const { error } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);
      
    if (error) {
      console.error('대량 알림 생성 중 오류 발생:', error.message);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('대량 알림 생성 중 오류 발생:', error.message);
    return false;
  }
};

/**
 * 모든 사용자에게 시스템 알림 생성
 */
export const createSystemNotificationForAll = async (
  params: Omit<CreateNotificationParams, 'userId' | 'type'>
) => {
  try {
    // 모든 사용자 ID 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');
    
    if (usersError) {
      console.error('사용자 목록 가져오기 중 오류 발생:', usersError.message);
      return false;
    }
    
    if (!users || users.length === 0) {
      return false;
    }
    
    // 사용자 ID 배열 추출
    const userIds = users.map(user => user.id);
    
    // 대량 알림 생성
    return await createBulkNotifications(userIds, {
      ...params,
      type: NotificationType.SYSTEM
    });
  } catch (error: any) {
    console.error('모든 사용자 알림 생성 중 오류 발생:', error.message);
    return false;
  }
};

/**
 * 특정 역할의 사용자들에게 알림 생성
 */
export const createNotificationForRole = async (
  role: string,
  params: Omit<CreateNotificationParams, 'userId'>
) => {
  try {
    // 특정 역할의 사용자 ID 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', role);
    
    if (usersError) {
      console.error('역할별 사용자 목록 가져오기 중 오류 발생:', usersError.message);
      return false;
    }
    
    if (!users || users.length === 0) {
      return false;
    }
    
    // 사용자 ID 배열 추출
    const userIds = users.map(user => user.id);
    
    // 대량 알림 생성
    return await createBulkNotifications(userIds, params);
  } catch (error: any) {
    console.error('역할별 알림 생성 중 오류 발생:', error.message);
    return false;
  }
};