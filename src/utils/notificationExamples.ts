import { 
  NotificationType, 
  NotificationPriority 
} from '@/types/notification';
import { 
  createNotification, 
  createBulkNotifications,
  createSystemNotificationForAll,
  createNotificationForRole
} from './notification';

/**
 * 캐시 충전 알림 생성
 * @param userId 사용자 ID
 * @param amount 충전 금액
 */
export const createCashChargeNotification = async (userId: string, amount: number) => {
  return await createNotification({
    userId,
    type: NotificationType.TRANSACTION,
    title: '캐시 충전 완료',
    message: `${amount.toLocaleString()}원 캐시 충전이 완료되었습니다.`,
    link: '/cash/history',
    priority: NotificationPriority.MEDIUM
  });
};

/**
 * 슬롯 상태 변경 알림 생성
 * @param userId 사용자 ID
 * @param slotId 슬롯 ID
 * @param status 변경된 상태 ('승인', '반려', '완료' 등)
 * @param reason 사유 (선택 사항)
 */
export const createSlotStatusChangeNotification = async (
  userId: string, 
  slotId: string, 
  status: string,
  reason?: string
) => {
  const title = `슬롯 ${status} 안내`;
  const message = reason 
    ? `슬롯(${slotId})이 ${status}되었습니다. 사유: ${reason}`
    : `슬롯(${slotId})이 ${status}되었습니다.`;
    
  return await createNotification({
    userId,
    type: NotificationType.SLOT,
    title,
    message,
    link: '/myinfo/services',
    priority: NotificationPriority.HIGH
  });
};

/**
 * 신규 서비스 오픈 알림 생성 (모든 사용자)
 * @param serviceName 서비스 이름
 * @param serviceLink 서비스 링크
 */
export const createNewServiceNotification = async (serviceName: string, serviceLink: string) => {
  return await createSystemNotificationForAll({
    title: '새로운 서비스 오픈',
    message: `${serviceName} 서비스가 새롭게 오픈되었습니다!`,
    link: serviceLink,
    priority: NotificationPriority.MEDIUM
  });
};

/**
 * 운영자에게 알림 전송
 * @param title 알림 제목
 * @param message 알림 내용
 * @param link 관련 링크 (선택 사항)
 */
export const notifyOperators = async (title: string, message: string, link?: string) => {
  return await createNotificationForRole('operator', {
    type: NotificationType.SYSTEM,
    title,
    message,
    link,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 모든 광고주에게 마케팅 알림 전송
 * @param title 알림 제목
 * @param message 알림 내용
 * @param link 관련 링크 (선택 사항)
 */
export const notifyAllAdvertisers = async (title: string, message: string, link?: string) => {
  return await createNotificationForRole('advertiser', {
    type: NotificationType.MARKETING,
    title,
    message,
    link,
    priority: NotificationPriority.MEDIUM
  });
};