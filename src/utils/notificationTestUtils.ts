import { 
  NotificationType, 
  NotificationPriority,
  NotificationStatus 
} from '@/types/notification';
import { supabase } from '@/supabase';

/**
 * 테스트 알림 생성 함수
 */
export const createTestNotification = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: NotificationType.SYSTEM,
        title: '테스트 알림',
        message: `이것은 테스트 알림입니다. 생성 시간: ${new Date().toLocaleTimeString()}`,
        link: '/notifications',
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.UNREAD
      })
      .select();
      
    if (error) {
      console.error('테스트 알림 생성 중 오류 발생:', error.message);
      return null;
    }
    
    console.log('테스트 알림 생성 성공:', data[0]);
    return data[0];
  } catch (error: any) {
    console.error('테스트 알림 생성 중 오류 발생:', error.message);
    return null;
  }
};

/**
 * 모든 테스트 알림 삭제
 */
export const deleteAllTestNotifications = async (userId: string) => {
  try {
    const { error, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .like('title', '테스트 알림%');
      
    if (error) {
      console.error('테스트 알림 삭제 중 오류 발생:', error.message);
      return false;
    }
    
    console.log(`${count}개의 테스트 알림이 삭제되었습니다.`);
    return true;
  } catch (error: any) {
    console.error('테스트 알림 삭제 중 오류 발생:', error.message);
    return false;
  }
};