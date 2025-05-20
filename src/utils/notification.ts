import { supabase, supabaseAdmin } from '@/supabase';
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
    // supabaseAdmin 사용하여 알림 생성
    const { data, error } = await supabaseAdmin
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
      console.error('단일 알림 생성 오류:', error);
      return null;
    }
    
    return data;
  } catch (error: any) {
    console.error('단일 알림 생성 중 예외 발생:', error);
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
    
    // 대량 삽입 (supabaseAdmin 사용)
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);
      
    if (error) {
      console.error('대량 알림 생성 오류:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('대량 알림 생성 중 예외 발생:', error);
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
    // 모든 사용자 ID 가져오기 (supabaseAdmin 사용)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id');
    
    if (usersError) {
      console.error('사용자 목록 조회 오류:', usersError);
      return false;
    }
    
    if (!users || users.length === 0) {
      console.warn('사용자가 없습니다.');
      return false;
    }
    
    // 사용자 ID 배열 추출
    const userIds = users.map(user => user.id);
    
    // 알림 데이터 생성
    const notificationsToInsert = userIds.map(userId => ({
      user_id: userId,
      type: NotificationType.SYSTEM,
      title: params.title,
      message: params.message,
      link: params.link,
      icon: params.icon,
      priority: params.priority || NotificationPriority.MEDIUM,
      status: params.status || NotificationStatus.UNREAD,
      expires_at: params.expiresAt?.toISOString()
    }));
    
    // supabaseAdmin을 사용하여 대량 삽입
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);
      
    if (error) {
      console.error('시스템 알림 생성 오류:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('전체 사용자 알림 생성 중 예외 발생:', error);
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
    // 특정 역할의 사용자 ID 가져오기 (supabaseAdmin 사용)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', role);
    
    if (usersError) {
      console.error('역할별 사용자 조회 오류:', usersError);
      return false;
    }
    
    if (!users || users.length === 0) {
      console.warn(`'${role}' 역할을 가진 사용자가 없습니다.`);
      return false;
    }
    
    // 사용자 ID 배열 추출
    const userIds = users.map(user => user.id);
    
    // 알림 데이터 생성
    const notificationsToInsert = userIds.map(userId => ({
      user_id: userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      icon: params.icon,
      priority: params.priority || NotificationPriority.MEDIUM,
      status: params.status || NotificationStatus.UNREAD,
      expires_at: params.expiresAt?.toISOString()
    }));
    
    // supabaseAdmin을 사용하여 대량 삽입
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);
      
    if (error) {
      console.error('알림 생성 오류:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('역할별 알림 생성 중 예외 발생:', error);
    return false;
  }
};