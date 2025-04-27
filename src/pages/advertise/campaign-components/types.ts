// 서비스 타입 관련 상수 및 인터페이스
export const SERVICE_TYPE_MAP = {
  'NS 트래픽': 'NaverShopTraffic',
  'NP 저장': 'NaverPlaceSave',
  'NP 공유': 'NaverPlaceShare',
  'NP 트래픽': 'NaverPlaceTraffic',
  'N 자동완성': 'NaverAuto',
  'N 트래픽': 'NaverTraffic',
  'C 트래픽': 'CoupangTraffic',
  'OH 트래픽': 'OhouseTraffic'
};

// 서비스 타입 코드와 카테고리 매핑 (역방향)
export const SERVICE_TYPE_TO_CATEGORY = {
  'NaverShopTraffic': 'NS 트래픽',
  'NaverPlaceSave': 'NP 저장',
  'NaverPlaceShare': 'NP 공유',
  'NaverPlaceTraffic': 'NP 트래픽',
  'NaverAuto': 'N 자동완성',
  'NaverTraffic': 'N 트래픽',
  'CoupangTraffic': 'C 트래픽',
  'OhouseTraffic': 'OH 트래픽'
};

// 슬롯 데이터 인터페이스
export interface SlotItem {
  id: string;
  matId: string;
  productId: number;
  userId: string;
  status: string;
  submittedAt: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  inputData: {
    productName: string;
    mid: string;
    url: string;
    keywords: string[];
  };
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: number;
    campaignName: string;
    logo?: string;
    status: string;
    serviceType: string;
  };
}

// 캠페인 데이터 인터페이스(원래 파일에서 import하고 있는 타입)
export interface CampaignData {
  id: number;
  campaignName: string;
  logo?: string;
  status: string;
  serviceType: string;
  [key: string]: any; // 추가 필드가 있을 경우를 위한 인덱스 시그니처
}

// 편집 상태 인터페이스
export interface EditingCellState {
  id: string;
  field: string;
}

// 캠페인 템플릿 컴포넌트의 Props 정의
export interface CampaignTemplateProps {
  campaignData: CampaignData;
  introPath?: string;
}
