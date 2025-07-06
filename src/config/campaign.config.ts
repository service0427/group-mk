// 캠페인 설정 구성 파일
// 프로젝트 내에서 캠페인 정보를 중앙 관리하기 위한 설정 파일입니다.
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

// 캠페인 설정 타입
export interface CampaignConfig {
  name: string;           // 캠페인 이름 (네이버, 쿠팡 등)
  serviceType: string;    // 서비스 유형
  types: {                // 캠페인 하위 유형 목록
    name: string;         // 유형 명칭 (N트래픽, N자동완성 등)
    code: string;         // 유형 코드 (데이터베이스에 저장되는 값)
  }[];
  logo?: string;          // 캠페인 로고 URL (선택적)
}

// 캠페인 목록 정의 - 표준화된 서비스 타입을 사용
export const CAMPAIGNS: CampaignConfig[] = [
  {
    name: '네이버',
    serviceType: '검색엔진',
    logo: '/media/ad-brand/naver.png',
    types: [
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_RANK], code: CampaignServiceType.NAVER_SHOPPING_RANK },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_TRAFFIC], code: CampaignServiceType.NAVER_SHOPPING_TRAFFIC },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_RANK], code: CampaignServiceType.NAVER_PLACE_RANK },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_TRAFFIC], code: CampaignServiceType.NAVER_PLACE_TRAFFIC },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SAVE], code: CampaignServiceType.NAVER_PLACE_SAVE },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SHARE], code: CampaignServiceType.NAVER_PLACE_SHARE },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_BLOG_POST], code: CampaignServiceType.NAVER_BLOG_POST },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_AUTO], code: CampaignServiceType.NAVER_AUTO },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_FAKESALE], code: CampaignServiceType.NAVER_SHOPPING_FAKESALE }
    ]
  },
  {
    name: '쿠팡',
    serviceType: '쇼핑몰',
    logo: '/media/ad-brand/coupang-app.png',
    types: [
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_TRAFFIC], code: CampaignServiceType.COUPANG_TRAFFIC },
      { name: SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_FAKESALE], code: CampaignServiceType.COUPANG_FAKESALE }
    ]
  },
];

// 모든 캠페인 이름 목록
export function getAllCampaignNames(): string[] {
  return CAMPAIGNS.map(campaign => campaign.name);
}

// 캠페인 이름으로 캠페인 정보 조회
export function getCampaignByName(name: string): CampaignConfig | undefined {
  return CAMPAIGNS.find(campaign => campaign.name === name);
}

// 캠페인 이름으로 캠페인의 모든 유형 목록 조회
export function getCampaignTypesByName(name: string): { name: string, code: string }[] {
  const campaign = getCampaignByName(name);
  return campaign ? campaign.types : [];
}

// 캠페인 이름과 유형 이름이 유효한지 확인
export function isValidCampaignAndType(campaignName: string, typeCode: string): boolean {
  const campaign = getCampaignByName(campaignName);
  if (!campaign) return false;

  return campaign.types.some(type => type.code === typeCode);
}

// 캠페인 이름과 유형 코드로 유형 이름 조회
export function getTypeNameByCode(campaignName: string, typeCode: string): string | null {
  const campaign = getCampaignByName(campaignName);
  if (!campaign) return null;

  const type = campaign.types.find(type => type.code === typeCode);
  return type ? type.name : null;
}

// 모든 캠페인 유형 조합 목록
export function getAllCampaignTypeCombinations(): {
  campaignName: string,
  typeName: string,
  typeCode: string
}[] {
  return CAMPAIGNS.flatMap(campaign =>
    campaign.types.map(type => ({
      campaignName: campaign.name,
      typeName: type.name,
      typeCode: type.code
    }))
  );
}

// 서비스 타입 코드로 캠페인 이름 조회
export function getCampaignNameByServiceType(serviceType: string): string | null {
  for (const campaign of CAMPAIGNS) {
    const hasType = campaign.types.some(type => type.code === serviceType);
    if (hasType) {
      return campaign.name;
    }
  }
  return null;
}

// 내키워드 기능을 지원하는 서비스 타입 목록
export const KEYWORD_SUPPORTED_SERVICES: string[] = [
  /*
  CampaignServiceType.NAVER_SHOPPING_RANK,
  CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
  CampaignServiceType.NAVER_PLACE_RANK,
  CampaignServiceType.NAVER_PLACE_TRAFFIC,
  CampaignServiceType.COUPANG_TRAFFIC
  */
];

// 서비스 타입이 내키워드 기능을 지원하는지 확인
export function isKeywordSupported(serviceType: string): boolean {
  return KEYWORD_SUPPORTED_SERVICES.includes(serviceType);
}

// 서비스별 필드 매핑 인터페이스
export interface ServiceFieldMapping {
  service_type: string;
  field_mapping: {
    basic_fields: Record<string, FieldConfig>;
    additional_fields: Record<string, FieldConfig>;
  };
  ui_config: {
    keyword_support: boolean;
    allow_direct_input: boolean;
    default_mode: 'keyword' | 'direct';
    field_order: string[];
    hide_for_guarantee?: string[];
    custom_validation?: Record<string, ValidationRule>;
  };
}

export interface FieldConfig {
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required: boolean;
  default?: any;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ValidationRule {
  pattern?: string;
  message: string;
}

// 기본 필드 설정 (모든 서비스 공통)
export const DEFAULT_BASIC_FIELDS: Record<string, FieldConfig> = {
  minimum_purchase: {
    label: '최소 구매수',
    type: 'number',
    required: true,
    default: 10,
    validation: {
      min: 1,
      max: 1000,
      message: '최소 1개에서 최대 1000개까지 입력 가능합니다'
    }
  },
  work_days: {
    label: '작업일',
    type: 'number',
    required: true,
    default: 1,
    validation: {
      min: 1,
      max: 30,
      message: '최소 1일에서 최대 30일까지 입력 가능합니다'
    }
  }
};

// service_type과 search_keyword type 매핑
export const SERVICE_TYPE_TO_KEYWORD_TYPE: Record<string, string> = {
  'NaverShoppingTraffic': 'shopping',
  'NaverShoppingRank': 'shopping',
  'NaverPlaceTraffic': 'place',
  'NaverPlaceRank': 'place',
  'NaverBlogTraffic': 'blog',
  'NaverBlogRank': 'blog',
  'NaverViewTraffic': 'view',
  'NaverViewRank': 'view',
  'NaverKinTraffic': 'kin',
  'NaverKinRank': 'kin',
  // 기본값
  'default': 'shopping'
};

// 순위 체크 지원 여부
export const RANKING_SUPPORT_STATUS: Record<string, boolean> = {
  'shopping': true,  // 지원됨 (테이블 존재)
  'place': false,    // 미지원 (테이블 없음, 순위 노출 안 함)
  'blog': false,     // 미지원 (테이블 없음)
  'view': false,     // 미지원 (테이블 없음)
  'kin': false       // 미지원 (테이블 없음)
};

// type별 순위 테이블 매핑 (실제 존재하는 테이블만 정의)
export const RANKING_TABLE_MAPPING: Record<string, {
  current: string;
  daily: string;
  hourly: string;
}> = {
  'shopping': {
    current: 'shopping_rankings_current',
    daily: 'shopping_rankings_daily',
    hourly: 'shopping_rankings_hourly'
  }
  // place, blog, view, kin 등은 테이블 생성 후 추가
};

// keyword type을 가져오는 헬퍼 함수
export function getKeywordTypeFromServiceType(serviceType: string): string {
  return SERVICE_TYPE_TO_KEYWORD_TYPE[serviceType] || SERVICE_TYPE_TO_KEYWORD_TYPE.default;
}