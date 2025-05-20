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

/**
 * 출금 승인 알림 생성
 * @param userId 사용자 ID
 * @param amount 출금 금액
 * @param feeAmount 수수료 금액
 */
export const createWithdrawApprovedNotification = async (userId: string, amount: number, feeAmount: number) => {
  const netAmount = amount - feeAmount;
  
  return await createNotification({
    userId,
    type: NotificationType.TRANSACTION,
    title: '출금 요청 승인',
    message: `요청하신 ${amount.toLocaleString()}원(수수료 ${feeAmount.toLocaleString()}원 제외 후 ${netAmount.toLocaleString()}원)의 출금이 승인되었습니다.`,
    link: '/withdraw/history',
    priority: NotificationPriority.HIGH
  });
};

/**
 * 출금 반려 알림 생성
 * @param userId 사용자 ID
 * @param amount 출금 금액
 * @param reason 반려 사유
 */
export const createWithdrawRejectedNotification = async (userId: string, amount: number, reason: string) => {
  return await createNotification({
    userId,
    type: NotificationType.TRANSACTION,
    title: '출금 요청 반려',
    message: `요청하신 ${amount.toLocaleString()}원의 출금이 반려되었습니다. 사유: ${reason}`,
    link: '/withdraw/history',
    priority: NotificationPriority.HIGH
  });
};

/**
 * 신규 출금 요청 알림 생성 (모든 운영자)
 * @param userId 사용자 ID
 * @param amount 출금 금액
 * @param userName 사용자 이름
 */
export const createNewWithdrawRequestNotification = async (userId: string, amount: number, userName: string) => {
  return await createNotificationForRole('operator', {
    type: NotificationType.SYSTEM,
    title: '새로운 출금 요청',
    message: `${userName}님의 ${amount.toLocaleString()}원 출금 요청이 등록되었습니다.`,
    link: '/admin/withdraw/approve',
    priority: NotificationPriority.HIGH
  });
};

/**
 * 신규 캠페인 신청 알림 생성 (운영자에게)
 * @param campaignId 캠페인 ID
 * @param campaignName 캠페인 이름
 * @param matId 신청자(총판) ID
 * @param serviceType 서비스 타입
 */
export const createCampaignRequestNotification = async (
  campaignId: string,
  campaignName: string,
  matId: string,
  serviceType: string
) => {
  return await notifyOperators(
    '새로운 캠페인 신청',
    `[${campaignName}] 캠페인이 신청되었습니다. (서비스: ${serviceType})`,
    `/admin/campaigns?id=${campaignId}`
  );
};

/**
 * 캠페인 승인 알림 생성 (신청자에게)
 * @param matId 신청자(총판) ID
 * @param campaignId 캠페인 ID
 * @param campaignName 캠페인 이름
 */
export const createCampaignApprovedNotification = async (
  matId: string,
  campaignId: string,
  campaignName: string
) => {
  return await createNotification({
    userId: matId,
    type: NotificationType.SERVICE,
    title: '캠페인 승인 완료',
    message: `[${campaignName}] 캠페인이 승인되었습니다.`,
    link: `/advertise/campaigns?id=${campaignId}`,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 캠페인 반려 알림 생성 (신청자에게)
 * @param matId 신청자(총판) ID
 * @param campaignId 캠페인 ID
 * @param campaignName 캠페인 이름
 * @param reason 반려 사유
 */
export const createCampaignRejectedNotification = async (
  matId: string,
  campaignId: string,
  campaignName: string,
  reason: string
) => {
  return await createNotification({
    userId: matId,
    type: NotificationType.SERVICE,
    title: '캠페인 반려 알림',
    message: `[${campaignName}] 캠페인이 반려되었습니다. 사유: ${reason}`,
    link: `/advertise/campaigns?id=${campaignId}`,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 캠페인 재승인 요청 알림 생성 (운영자에게)
 * @param campaignId 캠페인 ID
 * @param campaignName 캠페인 이름
 * @param matId 신청자(총판) ID
 */
export const createCampaignReapprovalRequestNotification = async (
  campaignId: string,
  campaignName: string,
  matId: string
) => {
  return await notifyOperators(
    '캠페인 재승인 요청',
    `[${campaignName}] 캠페인이 수정되어 재승인 요청되었습니다.`,
    `/admin/campaigns?id=${campaignId}`
  );
};

/**
 * 사용자 역할 변경 알림 생성
 * @param userId 사용자 ID
 * @param oldRole 이전 역할
 * @param newRole 새 역할
 * @param roleDisplayNames 역할 표시 이름 객체 (선택적)
 */
export const createRoleChangeNotification = async (
  userId: string,
  oldRole: string,
  newRole: string,
  roleDisplayNames?: Record<string, string>
) => {
  // 역할 표시 이름이 제공되지 않은 경우 역할 코드 사용
  const oldRoleDisplay = roleDisplayNames?.[oldRole] || oldRole;
  const newRoleDisplay = roleDisplayNames?.[newRole] || newRole;

  return await createNotification({
    userId,
    type: NotificationType.SYSTEM,
    title: '사용자 권한 변경',
    message: `회원님의 권한이 [${oldRoleDisplay}]에서 [${newRoleDisplay}]로 변경되었습니다.`,
    link: '/myinfo/profile',
    priority: NotificationPriority.HIGH
  });
};