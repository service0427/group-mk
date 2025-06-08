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