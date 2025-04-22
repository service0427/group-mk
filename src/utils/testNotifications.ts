import { 
  NotificationType, 
  NotificationPriority,
  NotificationStatus 
} from '@/types/notification';
import { supabase } from '@/supabase';

/**
 * 지정된 유형의 테스트 알림 생성 함수
 * @param userId 사용자 ID
 * @param type 알림 유형 (기본값: 랜덤)
 */
export const createTestNotification = async (userId: string, type?: NotificationType) => {
  try {
    // 유형이 지정되지 않은 경우 랜덤으로 선택
    const notificationType = type || Object.values(NotificationType)[Math.floor(Math.random() * Object.values(NotificationType).length)];
    
    // 우선순위 랜덤 결정
    const priorities = Object.values(NotificationPriority);
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // 유형별 샘플 메시지 설정
    const messages = {
      [NotificationType.SYSTEM]: '시스템 점검이 예정되어 있습니다. 자세한 내용은 공지사항을 확인해주세요.',
      [NotificationType.TRANSACTION]: '10,000원 캐시 충전이 완료되었습니다. 캐시 내역에서 확인하세요.',
      [NotificationType.SERVICE]: '새로운 서비스가 오픈되었습니다. 지금 확인해보세요!',
      [NotificationType.SLOT]: '슬롯 승인 요청이 처리되었습니다. 상태를 확인하세요.',
      [NotificationType.MARKETING]: '특별 프로모션 이벤트가 시작되었습니다. 할인 혜택을 놓치지 마세요!'
    };
    
    // 유형별 링크 설정
    const links = {
      [NotificationType.SYSTEM]: '/notice',
      [NotificationType.TRANSACTION]: '/cash/history',
      [NotificationType.SERVICE]: '/myinfo/services',
      [NotificationType.SLOT]: '/myinfo/services',
      [NotificationType.MARKETING]: '/notifications'
    };
    
    // 테스트 메시지
    const title = `테스트 알림 - ${notificationType}`;
    const message = messages[notificationType] || `이것은 테스트 알림입니다. 생성 시간: ${new Date().toLocaleTimeString()}`;
    
    // 현재 시간 생성
    const now = new Date();
    
    // 알림 생성
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notificationType,
        title,
        message,
        link: links[notificationType] || '/notifications',
        priority: randomPriority,
        status: NotificationStatus.UNREAD,
        created_at: now.toISOString() // 명시적으로 현재 시간 설정
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
 * 모든 알림 유형의 테스트 알림 생성
 * @param userId 사용자 ID
 */
export const createAllTypeNotifications = async (userId: string) => {
  try {
    const results = [];
    const types = Object.values(NotificationType);
    
    for (const type of types) {
      // 약간의 지연 추가 (실시간 테스트를 위해)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await createTestNotification(userId, type);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  } catch (error: any) {
    console.error('모든 유형 알림 생성 중 오류 발생:', error.message);
    return [];
  }
};

/**
 * 여러 개의 테스트 알림 생성 (랜덤 유형)
 * @param userId 사용자 ID
 * @param count 생성할 알림 개수
 */
export const createMultipleTestNotifications = async (userId: string, count: number = 5) => {
  try {
    const results = [];
    
    for (let i = 0; i < count; i++) {
      // 약간의 지연 추가 (실시간 테스트를 위해)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await createTestNotification(userId);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  } catch (error: any) {
    console.error('다중 테스트 알림 생성 중 오류 발생:', error.message);
    return [];
  }
};

/**
 * 모든 테스트 알림 삭제
 * 주의: 개발 환경에서만 사용할 것
 */
export const deleteAllTestNotifications = async (userId: string) => {
  try {
    // 24시간 이내의 '테스트 알림'으로 시작하는 알림만 삭제
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { error, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .gt('created_at', oneDayAgo.toISOString())
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
