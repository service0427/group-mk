// 캠페인 설정 구성 파일
// 프로젝트 내에서 캠페인 정보를 중앙 관리하기 위한 설정 파일입니다.

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

// 캠페인 목록 정의
export const CAMPAIGNS: CampaignConfig[] = [
  {
    name: '네이버',
    serviceType: '검색엔진',
    logo: '/media/ad-brand/naver.png',
    types: [
      { name: 'N트래픽', code: 'ntraffic' },  // 임시로 메뉴로 만듬 , 나중에 트래픽으로 변경 예정 { name: '트래픽', code: 'traffic' }, 
      { name: 'N자동완성', code: 'nautocomplete' }, // 나중에 가구매으로 변경 예정 { name: '가구매', code: 'fakesale' }, 
      { name: 'N쇼핑', code: 'nshopping' } // 나중에 플레이스로 변경 예정 { name: '플레이스', code: 'place' }, 
    ]
  },
  {
    name: '쿠팡',
    serviceType: '쇼핑몰',
    logo: '/media/ad-brand/coupang-app.png',
    types: [
      { name: 'C쇼핑', code: 'c_shopping' },
      { name: 'C브랜드', code: 'c_brand' }
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