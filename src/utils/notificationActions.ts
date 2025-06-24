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
    link: '/withdraw',
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
    link: '/withdraw',
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
    link: '/admin/withdraw_approve',
    priority: NotificationPriority.HIGH
  });
};

/**
 * 서비스 타입 코드를 한글명으로 변환하는 함수
 */
const getServiceTypeLabel = (serviceType: string): string => {
  // DB 코드를 CampaignServiceType enum으로 매핑
  const codeToEnumMap: Record<string, CampaignServiceType> = {
    'ntraffic': CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
    'nrank': CampaignServiceType.NAVER_SHOPPING_RANK,
    'nplacetraffic': CampaignServiceType.NAVER_PLACE_TRAFFIC,
    'nplacesave': CampaignServiceType.NAVER_PLACE_SAVE,
    'nplaceshare': CampaignServiceType.NAVER_PLACE_SHARE,
    'nplacerank': CampaignServiceType.NAVER_PLACE_RANK,
    'nauto': CampaignServiceType.NAVER_AUTO,
    'ctraffic': CampaignServiceType.COUPANG_TRAFFIC,
    'cfakesale': CampaignServiceType.COUPANG_FAKESALE,
    'instagram': CampaignServiceType.INSTAGRAM,
    'photovideo': CampaignServiceType.PHOTO_VIDEO_PRODUCTION,
    'livebroadcast': CampaignServiceType.LIVE_BROADCASTING
  };

  const enumType = codeToEnumMap[serviceType] || serviceType;
  return SERVICE_TYPE_LABELS[enumType as CampaignServiceType] || serviceType;
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
  const serviceTypeLabel = getServiceTypeLabel(serviceType);
  return await notifyOperators(
    '새로운 캠페인 신청',
    `[${campaignName}] 캠페인이 신청되었습니다. (서비스: ${serviceTypeLabel})`,
    `/admin/campaigns/all`
  );
};

/**
 * 캠페인 승인 알림 생성 (신청자에게)
 * @param matId 신청자(총판) ID
 * @param campaignId 캠페인 ID
 * @param campaignName 캠페인 이름
 */
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

// 서비스 타입을 URL 경로 형식으로 변환하는 함수
const getServiceTypeUrlPath = (serviceType?: string): string => {
  if (!serviceType) return '';

  // serviceType이 이미 kebab-case 형식이면 그대로 반환
  if (serviceType.includes('-')) {
    return serviceType;
  }

  // CampaignServiceType 열거형 타입을 사용하는 경우 매핑
  // 타입에 따른 URL 경로 매핑
  const typeToPathMap: Record<string, string> = {
    [CampaignServiceType.NAVER_AUTO]: 'naver-auto',
    [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: 'naver-shopping-traffic',
    [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: 'naver-shopping-fakesale',
    [CampaignServiceType.NAVER_SHOPPING_RANK]: 'naver-shopping-rank',
    [CampaignServiceType.NAVER_PLACE_TRAFFIC]: 'naver-place-traffic',
    [CampaignServiceType.NAVER_PLACE_SAVE]: 'naver-place-save',
    [CampaignServiceType.NAVER_PLACE_SHARE]: 'naver-place-share',
    [CampaignServiceType.NAVER_PLACE_RANK]: 'naver-place-rank',
    [CampaignServiceType.COUPANG_TRAFFIC]: 'coupang-traffic',
    [CampaignServiceType.COUPANG_FAKESALE]: 'coupang-fakesale'
  };

  const mappedPath = typeToPathMap[serviceType];
  if (mappedPath) {
    return mappedPath;
  }

  // 직접 매핑이 없는 경우, CamelCase를 kebab-case로 변환 (새로운 타입이 추가될 경우 대비)
  return serviceType
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
};

export const createCampaignApprovedNotification = async (
  matId: string,
  campaignId: string,
  campaignName: string,
  serviceType?: string
) => {
  // 총판이 접근 가능한 캠페인 관리 페이지로 변경
  const campaignPath = '/manage/campaign';


  return await createNotification({
    userId: matId,
    type: NotificationType.SERVICE,
    title: '캠페인 승인 완료',
    message: `[${campaignName}] 캠페인이 승인되어 '준비중' 상태가 되었습니다. 캠페인 관리에서 '진행중'으로 변경하시면 캠페인 소개 페이지에 노출됩니다.`,
    link: campaignPath,
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
  reason: string,
  serviceType?: string
) => {
  // 총판이 접근 가능한 캠페인 관리 페이지로 변경
  const campaignPath = '/manage/campaign';


  return await createNotification({
    userId: matId,
    type: NotificationType.SERVICE,
    title: '캠페인 반려 알림',
    message: `[${campaignName}] 캠페인이 반려되었습니다. 사유: ${reason}`,
    link: campaignPath,
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
    `/admin/campaigns/all`
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

/**
 * 보장형 견적요청 알림 생성 (사용자 → 총판)
 * @param distributorId 총판 ID
 * @param campaignName 캠페인 이름
 * @param quoteId 견적요청 ID
 * @param serviceName 서비스명
 * @param slotType 슬롯 타입
 */
export const createGuaranteeQuoteRequestNotification = async (
  distributorId: string,
  campaignName: string,
  quoteId: string,
  serviceName: string,
  slotType: string
) => {
  const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
  return await createNotification({
    userId: distributorId,
    type: NotificationType.SERVICE,
    title: '새로운 보장형 견적요청',
    message: `[${serviceName}/${slotTypeName}] ${campaignName} 캠페인에 대한 새로운 견적 요청이 있습니다.`,
    link: `/manage/guarantee-quotes?quoteId=${quoteId}`,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 보장형 구매 알림 생성 (사용자 → 총판)
 * @param distributorId 총판 ID
 * @param campaignName 캠페인 이름
 * @param slotId 슬롯 ID
 * @param serviceName 서비스명
 * @param slotType 슬롯 타입
 */
export const createGuaranteePurchaseNotification = async (
  distributorId: string,
  campaignName: string,
  slotId: string,
  serviceName: string,
  slotType: string
) => {
  const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
  return await createNotification({
    userId: distributorId,
    type: NotificationType.SLOT,
    title: '보장형 슬롯 구매 알림',
    message: `[${serviceName}/${slotTypeName}] ${campaignName} 슬롯이 구매되었습니다. 승인이 필요합니다.`,
    link: `/manage/guarantee-quotes?slotId=${slotId}`,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 보장형 승인 알림 생성 (총판 → 사용자)
 * @param userId 사용자 ID
 * @param campaignName 캠페인 이름
 * @param slotId 슬롯 ID
 * @param isApproved 승인 여부
 * @param serviceName 서비스명
 * @param slotType 슬롯 타입
 * @param reason 반려 사유 (반려시)
 */
export const createGuaranteeApprovalNotification = async (
  userId: string,
  campaignName: string,
  slotId: string,
  isApproved: boolean,
  serviceName: string,
  slotType: string,
  reason?: string
) => {
  const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
  const title = isApproved ? '보장형 슬롯 승인 완료' : '보장형 슬롯 반려';
  const message = isApproved
    ? `[${serviceName}/${slotTypeName}] ${campaignName} 슬롯이 승인되었습니다.`
    : `[${serviceName}/${slotTypeName}] ${campaignName} 슬롯이 반려되었습니다. 사유: ${reason}`;

  return await createNotification({
    userId,
    type: NotificationType.SLOT,
    title,
    message,
    link: `/my-services?slotId=${slotId}`,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 보장형 협상 완료 알림 생성 (총판 → 사용자)
 * @param userId 사용자 ID
 * @param campaignName 캠페인 이름
 * @param quoteId 견적요청 ID
 * @param serviceName 서비스명
 * @param slotType 슬롯 타입
 * @param finalPrice 최종 협상 가격
 * @param slotInfo 슬롯 정보 (날짜, 보장 횟수 등)
 */
export const createNegotiationCompleteNotification = async (
  userId: string,
  campaignName: string,
  quoteId: string,
  serviceName: string,
  slotType: string,
  finalPrice: number,
  slotInfo?: {
    startDate?: string;
    endDate?: string;
    guaranteeCount?: number;
    keyword?: string;
  }
) => {
  const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
  let message = `[${serviceName}/${slotTypeName}] ${campaignName}`;
  
  if (slotInfo?.keyword) {
    message += ` (${slotInfo.keyword})`;
  }
  
  message += ` 협상이 완료되었습니다. `;
  
  // 날짜 정보 추가
  if (slotInfo?.startDate && slotInfo?.endDate) {
    const start = new Date(slotInfo.startDate).toLocaleDateString('ko-KR');
    const end = new Date(slotInfo.endDate).toLocaleDateString('ko-KR');
    message += `${start} ~ ${end}, `;
  }
  
  message += `일일 ${finalPrice.toLocaleString()}원`;
  
  if (slotInfo?.guaranteeCount) {
    message += ` × ${slotInfo.guaranteeCount}회`;
  }
  
  message += `으로 구매 가능합니다.`;
  
  return await createNotification({
    userId,
    type: NotificationType.SERVICE,
    title: '협상 완료 - 구매 가능',
    message,
    link: `/my-services?quoteId=${quoteId}&openPurchase=true`,
    priority: NotificationPriority.HIGH
  });
};

/**
 * 보장형 재협상 요청 알림 생성 (양방향)
 * @param recipientId 수신자 ID
 * @param campaignName 캠페인 이름
 * @param quoteId 견적요청 ID
 * @param serviceName 서비스명
 * @param slotType 슬롯 타입
 * @param slotInfo 슬롯 정보 (키워드, 금액 등)
 * @param isFromDistributorPage 보장형 슬롯 관리 페이지에서 보낸 것인지
 */
export const createRenegotiationRequestNotification = async (
  recipientId: string,
  campaignName: string,
  quoteId: string,
  serviceName: string,
  slotType: string,
  slotInfo?: {
    keyword?: string;
    targetRank?: number;
    finalDailyAmount?: number;
    guaranteeCount?: number;
  },
  isFromDistributorPage: boolean = false
) => {
  const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
  let message = `[${serviceName}/${slotTypeName}] ${campaignName} 협상 재개 요청이 있습니다.`;
  
  // 추가 정보가 있으면 포함
  if (slotInfo) {
    const details: string[] = [];
    if (slotInfo.keyword) details.push(`키워드: ${slotInfo.keyword}`);
    if (slotInfo.targetRank) details.push(`목표순위: ${slotInfo.targetRank}위`);
    if (slotInfo.finalDailyAmount && slotInfo.guaranteeCount) {
      details.push(`기존협상: 일일 ${slotInfo.finalDailyAmount.toLocaleString()}원 × ${slotInfo.guaranteeCount}회`);
    }
    if (details.length > 0) {
      message += ` (${details.join(', ')})`;
    }
  }
  
  // 발신 페이지에 따라 링크 설정
  // 보장형 슬롯 관리에서 보냈으면 → 수신자는 이용 중인 서비스로
  // 이용 중인 서비스에서 보냈으면 → 수신자는 보장형 슬롯 관리로
  const link = isFromDistributorPage 
    ? `/my-services?quoteId=${quoteId}`              // 사용자: 이용 중인 서비스로
    : `/manage/guarantee-quotes?quoteId=${quoteId}`;  // 총판: 보장형 슬롯 관리로
  
  return await createNotification({
    userId: recipientId,
    type: NotificationType.SERVICE,
    title: '재협상 요청',
    message,
    link,
    priority: NotificationPriority.HIGH
  });
};

// 메시지 알림 디바운싱을 위한 맵
const messageNotificationQueue = new Map<string, { timer: NodeJS.Timeout; count: number }>();

/**
 * 협상 메시지 알림 생성 (양방향, 디바운싱 적용)
 * @param recipientId 수신자 ID
 * @param campaignName 캠페인 이름
 * @param negotiationId 협상 ID
 * @param serviceName 서비스명
 * @param slotType 슬롯 타입
 * @param slotInfo 슬롯 정보
 * @param messageType 메시지 타입
 * @param proposedPrice 제안 가격
 * @param isFromDistributorPage 보장형 슬롯 관리 페이지에서 보낸 것인지
 * @param messageCount 안읽은 메시지 수
 */
export const createNegotiationMessageNotification = async (
  recipientId: string,
  campaignName: string,
  negotiationId: string,
  serviceName: string,
  slotType: string,
  slotInfo?: {
    keyword?: string;
    targetRank?: number;
    guaranteeCount?: number;
  },
  messageType?: string,
  proposedPrice?: number,
  isFromDistributorPage: boolean = false,
  messageCount: number = 1
) => {
  const queueKey = `negotiation-${recipientId}-${negotiationId}`;
  
  // 주요 메시지 타입은 즉시 전송 (디바운싱 제외)
  const importantMessageTypes = ['price_proposal', 'counter_offer', 'acceptance', 'renegotiation_request'];
  const isImportantMessage = messageType && importantMessageTypes.includes(messageType);
  
  if (isImportantMessage) {
    // 주요 메시지는 즉시 전송
    const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
    let message = `[${serviceName}/${slotTypeName}] ${campaignName}`;
    
    // 슬롯 정보 추가
    if (slotInfo && slotInfo.keyword) {
      message += ` (${slotInfo.keyword})`;
    }
    
    // 메시지 타입에 따라 다른 내용 표시
    if (messageType === 'price_proposal' && proposedPrice) {
      message += ` 협상에서 새로운 가격 제안이 있습니다. (일일 ${proposedPrice.toLocaleString()}원)`;
    } else if (messageType === 'counter_offer' && proposedPrice) {
      message += ` 협상에서 역제안이 있습니다. (일일 ${proposedPrice.toLocaleString()}원)`;
    } else if (messageType === 'acceptance' && proposedPrice) {
      message += ` 협상 조건이 수락되었습니다. (일일 ${proposedPrice.toLocaleString()}원)`;
    }
    
    // 발신 페이지에 따라 링크 설정
    const link = isFromDistributorPage 
      ? `/my-services?negotiationId=${negotiationId}&openModal=true`
      : `/manage/guarantee-quotes?negotiationId=${negotiationId}&openModal=true`;
    
    await createNotification({
      userId: recipientId,
      type: NotificationType.SERVICE,
      title: messageType === 'price_proposal' ? '가격 제안' : 
             messageType === 'counter_offer' ? '역제안' : 
             messageType === 'acceptance' ? '협상 수락' : '협상 메시지',
      message,
      link,
      priority: NotificationPriority.HIGH // 주요 메시지는 높은 우선순위
    });
    
    // 큐에서 해당 키 제거 (디바운싱 중인 일반 메시지가 있다면)
    if (messageNotificationQueue.has(queueKey)) {
      const existing = messageNotificationQueue.get(queueKey)!;
      clearTimeout(existing.timer);
      messageNotificationQueue.delete(queueKey);
    }
    
    return;
  }
  
  // 일반 메시지는 기존 디바운싱 로직 적용
  // 기존 타이머가 있으면 취소
  if (messageNotificationQueue.has(queueKey)) {
    const existing = messageNotificationQueue.get(queueKey)!;
    clearTimeout(existing.timer);
    messageCount = existing.count + messageCount;
  }
  
  // 30초 디바운싱
  const timer = setTimeout(async () => {
    const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
    let message = `[${serviceName}/${slotTypeName}] ${campaignName}`;
    
    // 슬롯 정보 추가
    if (slotInfo && slotInfo.keyword) {
      message += ` (${slotInfo.keyword})`;
    }
    
    // 메시지 타입에 따라 다른 내용 표시
    if (messageType === 'price_proposal' && proposedPrice) {
      message += ` 협상에서 새로운 가격 제안이 있습니다. (일일 ${proposedPrice.toLocaleString()}원)`;
    } else if (messageType === 'counter_offer' && proposedPrice) {
      message += ` 협상에서 역제안이 있습니다. (일일 ${proposedPrice.toLocaleString()}원)`;
    } else if (messageType === 'acceptance' && proposedPrice) {
      message += ` 협상 조건이 수락되었습니다. (일일 ${proposedPrice.toLocaleString()}원)`;
    } else {
      message += ` 협상에서 ${messageCount}개의 새 메시지가 있습니다.`;
    }
    
    // 발신 페이지에 따라 링크 설정
    // 보장형 슬롯 관리에서 보냈으면 → 수신자는 이용 중인 서비스로
    // 이용 중인 서비스에서 보냈으면 → 수신자는 보장형 슬롯 관리로
    const link = isFromDistributorPage 
      ? `/my-services?negotiationId=${negotiationId}&openModal=true`              // 사용자: 이용 중인 서비스로
      : `/manage/guarantee-quotes?negotiationId=${negotiationId}&openModal=true`;  // 총판: 보장형 슬롯 관리로
    
    await createNotification({
      userId: recipientId,
      type: NotificationType.SERVICE,
      title: messageType === 'price_proposal' ? '가격 제안' : 
             messageType === 'counter_offer' ? '역제안' : 
             messageType === 'acceptance' ? '협상 수락' : '협상 메시지',
      message,
      link,
      priority: NotificationPriority.MEDIUM
    });
    
    messageNotificationQueue.delete(queueKey);
  }, 30000);
  
  messageNotificationQueue.set(queueKey, { timer, count: messageCount });
};

/**
 * 1:1 문의 메시지 알림 생성 (양방향, 디바운싱 적용)
 * @param recipientId 수신자 ID
 * @param inquiryTitle 문의 제목
 * @param inquiryId 문의 ID
 * @param serviceName 서비스명
 * @param campaignName 캠페인명
 * @param slotType 슬롯 타입
 * @param slotInfo 슬롯 정보
 * @param messageCount 안읽은 메시지 수
 */
export const createInquiryMessageNotification = async (
  recipientId: string,
  inquiryTitle: string,
  inquiryId: string,
  serviceName: string,
  campaignName: string,
  slotType: string,
  slotInfo?: {
    keyword?: string;
    targetRank?: number;
    startDate?: string;
    endDate?: string;
  },
  messageCount: number = 1
) => {
  const queueKey = `inquiry-${recipientId}-${inquiryId}`;
  
  // 기존 타이머가 있으면 취소
  if (messageNotificationQueue.has(queueKey)) {
    const existing = messageNotificationQueue.get(queueKey)!;
    clearTimeout(existing.timer);
    messageCount = existing.count + messageCount;
  }
  
  // 30초 디바운싱
  const timer = setTimeout(async () => {
    const slotTypeName = slotType === 'guarantee' ? '보장형' : '일반형';
    let message = `[${serviceName}/${slotTypeName}] ${campaignName}`;
    
    // 슬롯 정보 추가
    if (slotInfo && slotInfo.keyword) {
      message += ` (${slotInfo.keyword})`;
    }
    
    message += ` - "${inquiryTitle}" 문의에 ${messageCount}개의 새 메시지가 있습니다.`;
    
    await createNotification({
      userId: recipientId,
      type: NotificationType.SERVICE,
      title: '1:1 문의 답변',
      message,
      link: `/my-services?inquiryId=${inquiryId}&openModal=true`,
      priority: NotificationPriority.MEDIUM
    });
    
    messageNotificationQueue.delete(queueKey);
  }, 30000);
  
  messageNotificationQueue.set(queueKey, { timer, count: messageCount });
};