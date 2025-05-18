// 캠페인 서비스 타입 정의
export enum CampaignServiceType {
  NAVER_TRAFFIC = 'NaverTraffic',
  NAVER_AUTO = 'NaverAuto',
  NAVER_SHOPPING_TRAFFIC = 'NaverShoppingTraffic',
  NAVER_SHOPPING_FAKESALE = 'NaverShoppingFakeSale',
  NAVER_PLACE_TRAFFIC = 'NaverPlaceTraffic',
  NAVER_PLACE_SAVE = 'NaverPlaceSave',
  NAVER_PLACE_SHARE = 'NaverPlaceShare',
  COUPANG_TRAFFIC = 'CoupangTraffic',
  COUPANG_FAKESALE = 'CoupangFakeSale'
}

// 서비스 타입 설명
export const SERVICE_TYPE_LABELS: Record<CampaignServiceType, string> = {
  [CampaignServiceType.NAVER_TRAFFIC]: 'N 트래픽',
  [CampaignServiceType.NAVER_AUTO]: 'N 자동완성',
  [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: 'NS 트래픽',
  [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: 'NS 가구매',
  [CampaignServiceType.NAVER_PLACE_TRAFFIC]: 'NP 트래픽',
  [CampaignServiceType.NAVER_PLACE_SAVE]: 'NP 저장하기',
  [CampaignServiceType.NAVER_PLACE_SHARE]: 'NP 블로그공유',
  [CampaignServiceType.COUPANG_TRAFFIC]: 'CP 트래픽',
  [CampaignServiceType.COUPANG_FAKESALE]: 'CP 가구매'
};

// URL 경로에서 서비스 타입을 결정하는 헬퍼 함수
export const getServiceTypeFromPath = (platform: string, type: string, subservice?: string): CampaignServiceType => {
  // 새로운 URL 구조 파라미터 처리 (platform, type, subservice)
  if (platform === 'naver') {
    if (type === 'traffic') {
      return CampaignServiceType.NAVER_TRAFFIC;
    } else if (type === 'auto') {
      return CampaignServiceType.NAVER_AUTO;
    } else if (type === 'shopping-traffic' || (subservice === 'shopping' && type === 'traffic')) {
      return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
    } else if (type === 'shopping-fakesale' || (subservice === 'shopping' && type === 'fakesale')) {
      return CampaignServiceType.NAVER_SHOPPING_FAKESALE;
    } else if (type === 'place-traffic' || (subservice === 'place' && type === 'traffic')) {
      return CampaignServiceType.NAVER_PLACE_TRAFFIC;
    } else if (type === 'place-save' || (subservice === 'place' && type === 'save')) {
      return CampaignServiceType.NAVER_PLACE_SAVE;
    } else if (type === 'place-share' || (subservice === 'place' && type === 'share')) {
      return CampaignServiceType.NAVER_PLACE_SHARE;
    }
  } else if (platform === 'coupang') {
    if (type === 'traffic') {
      return CampaignServiceType.COUPANG_TRAFFIC;
    } else if (type === 'fakesale') {
      return CampaignServiceType.COUPANG_FAKESALE;
    }
  }
  
  // URL 패턴 처리 (기존 호환성 유지)
  const pathname = `${platform}/${subservice ? subservice + '/' : ''}${type}`;
  if (pathname.includes('naver/shopping/fakesale') || pathname === 'naver-shopping-fakesale') {
    return CampaignServiceType.NAVER_SHOPPING_FAKESALE;
  }
  if (pathname.includes('naver/shopping') || pathname === 'naver-shopping-traffic') {
    return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
  }
  if (pathname.includes('naver/place/save') || pathname === 'naver-place-save') {
    return CampaignServiceType.NAVER_PLACE_SAVE;
  }
  if (pathname.includes('naver/place/share') || pathname === 'naver-place-share') {
    return CampaignServiceType.NAVER_PLACE_SHARE;
  }
  if (pathname.includes('naver/place') || pathname === 'naver-place-traffic') {
    return CampaignServiceType.NAVER_PLACE_TRAFFIC;
  }
  if (pathname.includes('naver/auto') || pathname === 'naver-auto') {
    return CampaignServiceType.NAVER_AUTO;
  }
  if (pathname.includes('naver/traffic') || pathname === 'naver-traffic') {
    return CampaignServiceType.NAVER_TRAFFIC;
  }
  if (pathname.includes('coupang/fakesale') || pathname === 'coupang-fakesale') {
    return CampaignServiceType.COUPANG_FAKESALE;
  }
  if (pathname.includes('coupang') || pathname === 'coupang-traffic') {
    return CampaignServiceType.COUPANG_TRAFFIC;
  }
  
  // 기본값
  return CampaignServiceType.NAVER_TRAFFIC;
};

// 캠페인 모달 관련 공통 타입 정의
export interface ICampaign {
  id: string;
  campaignName: string;
  description: string;
  logo: string;
  efficiency: string;
  minQuantity: string;
  deadline: string;
  status: string | {
    label: string;
    color: string;
    status?: string;
  };
  originalData?: any;
  additionalLogic?: string;
  detailedDescription?: string;
  unitPrice?: string;
  bannerImage?: string;
  rejectionReason?: string;
  // Additional fields from original ICampaign in CampaignContent.tsx
  serviceType?: string | CampaignServiceType; // 서비스 유형
  matId?: string; // 매트 ID
  serviceName?: string; // 서비스 이름
  updatedAt?: string; // 업데이트 시간
  additionalFields?: any; // 추가 필드 (CampaignPreviewModal에서 사용)
}

// 확장된 캠페인 인터페이스
export interface ExtendedCampaign extends ICampaign {
  // These fields are already in ICampaign but are listed here for backward compatibility
  additionalLogic?: string;
  detailedDescription?: string;
  unitPrice?: string;
  bannerImage?: string;
  rejectionReason?: string;
  serviceType?: string;
}

// 캠페인 상태 관련 유틸리티 함수
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pending': return '준비중';
    case 'pause': return '표시안함';
    case 'waiting_approval': return '승인 대기중';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

// 상태값에 따른 색상 반환
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'success';
    case 'pause': return 'warning';
    case 'pending': return 'info';
    case 'completed': return 'primary';
    case 'rejected': return 'danger';
    case 'waiting_approval': return 'primary';
    default: return 'info';
  }
};