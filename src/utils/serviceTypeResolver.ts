/**
 * 서비스 타입 해결을 위한 유틸리티 함수
 * 다양한 입력 형식(URL, 문자열, 열거형)에서 일관된 서비스 타입을 반환합니다.
 */

import { CampaignServiceType, getServiceTypeFromPath } from '@/components/campaign-modals/types';
import { CAMPAIGNS } from '@/config/campaign.config';

/**
 * URL 경로에서 서비스 타입을 추출하는 함수
 * 
 * @param pathname URL 경로
 * @returns 서비스 타입 또는 null
 */
export const getServiceTypeFromUrl = (pathname: string): CampaignServiceType | null => {
  try {
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // /advertise/campaigns/{info|my|manage}/{serviceType} 형식 처리
    if (pathSegments.length >= 4 && 
        pathSegments[0] === 'advertise' && 
        pathSegments[1] === 'campaigns') {
      
      const serviceTypeStr = pathSegments[3];
      if (serviceTypeStr) {
        // 특별 케이스: 직접 처리
        if (serviceTypeStr === 'naver-shopping-traffic') {
          return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
        }
        
        if (serviceTypeStr === 'naver-auto') {
          return CampaignServiceType.NAVER_AUTO;
        }
        
        // naver-traffic, naver-shopping-traffic 같은 형식 파싱
        const parts = serviceTypeStr.split('-');
        
        if (parts.length === 2) {
          // platform-type (예: naver-traffic)
          return getServiceTypeFromPath(parts[0], parts[1]);
        } else if (parts.length === 3) {
          // 세 부분으로 나눠진 URL (예: naver-shopping-traffic)
          // 맞는 순서로 파라미터 전달 (platform, type, subservice)
          // naver-shopping-traffic => naver, traffic, shopping 으로 전달
          return getServiceTypeFromPath(parts[0], parts[2], parts[1]);
        }
      }
    }
    return null;
  } catch (e) {
    console.warn("서비스 타입 추출 실패:", e);
    return null;
  }
};

/**
 * 캠페인 이름에서 서비스 타입을 추출하는 함수
 * 
 * @param campaignName 캠페인 이름
 * @returns 서비스 타입 또는 null
 */
export const getServiceTypeFromCampaignName = (campaignName: string): CampaignServiceType | null => {
  if (!campaignName) return null;
  
  const lowerName = campaignName.toLowerCase();
  
  // 자동완성 서비스 확인
  if (lowerName.includes('자동완성') || lowerName.includes('auto')) {
    return CampaignServiceType.NAVER_AUTO;
  }
  
  // 네이버 쇼핑 트래픽 확인
  if (lowerName.includes('쇼핑') && lowerName.includes('트래픽')) {
    return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
  }
  
  // 네이버 트래픽 확인
  if (lowerName.includes('네이버') && lowerName.includes('트래픽')) {
    return CampaignServiceType.NAVER_TRAFFIC;
  }
  
  // 네이버 플레이스 확인
  if (lowerName.includes('플레이스') || lowerName.includes('place')) {
    if (lowerName.includes('저장')) {
      return CampaignServiceType.NAVER_PLACE_SAVE;
    }
    if (lowerName.includes('공유')) {
      return CampaignServiceType.NAVER_PLACE_SHARE;
    }
    return CampaignServiceType.NAVER_PLACE_TRAFFIC;
  }
  
  // 쿠팡 확인
  if (lowerName.includes('쿠팡') || lowerName.includes('coupang')) {
    if (lowerName.includes('가구매') || lowerName.includes('fake')) {
      return CampaignServiceType.COUPANG_FAKESALE;
    }
    return CampaignServiceType.COUPANG_TRAFFIC;
  }
  
  return null;
};

/**
 * 문자열이나 열거형 값을 CampaignServiceType으로 표준화하는 함수
 * 
 * @param serviceCode 서비스 코드 (문자열 또는 열거형)
 * @returns 표준화된 CampaignServiceType
 */
export const normalizeServiceType = (
  serviceCode: string | CampaignServiceType | undefined | null
): CampaignServiceType => {
  if (!serviceCode) {
    return CampaignServiceType.NAVER_TRAFFIC; // 기본값
  }
  
  // 이미 CampaignServiceType 열거형이면 그대로 반환
  if (Object.values(CampaignServiceType).includes(serviceCode as CampaignServiceType)) {
    return serviceCode as CampaignServiceType;
  }
  
  // 문자열인 경우 매핑
  if (typeof serviceCode === 'string') {
    // 정확한 열거형 값과 일치하는지 확인
    const exactMatch = Object.values(CampaignServiceType).find(
      type => type === serviceCode
    );
    if (exactMatch) {
      return exactMatch;
    }
    
    // 대소문자 무시하고 일치하는지 확인
    const caseInsensitiveMatch = Object.values(CampaignServiceType).find(
      type => type.toLowerCase() === serviceCode.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch;
    }
    
    // '자동완성' 또는 'auto' 포함 여부 확인
    if (serviceCode.includes('자동완성') || serviceCode.toLowerCase().includes('auto')) {
      return CampaignServiceType.NAVER_AUTO;
    }
    
    // 다른 케이스 처리
    switch (serviceCode.toLowerCase()) {
      case 'navertraffic':
      case 'naver-traffic':
      case 'ntraffic':
        return CampaignServiceType.NAVER_TRAFFIC;
      
      case 'naverauto':
      case 'naver-auto':
      case 'nauto':
        return CampaignServiceType.NAVER_AUTO;
      
      case 'navershoppingtraffic':
      case 'naver-shopping-traffic':
      case 'nshoppingtraffic':
      case 'nshopping':
      case 'nstraffic':
        return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
      
      case 'navershoppingfakesale':
      case 'naver-shopping-fakesale':
      case 'nshoppingfakesale':
      case 'nsfakesale':
        return CampaignServiceType.NAVER_SHOPPING_FAKESALE;
      
      case 'naverplacetraffic':
      case 'naver-place-traffic':
      case 'nplacetraffic':
      case 'nplace':
        return CampaignServiceType.NAVER_PLACE_TRAFFIC;
      
      case 'naverplacesave':
      case 'naver-place-save':
      case 'nplacesave':
        return CampaignServiceType.NAVER_PLACE_SAVE;
      
      case 'naverplaceshare':
      case 'naver-place-share':
      case 'nplaceshare':
        return CampaignServiceType.NAVER_PLACE_SHARE;
      
      case 'coupangtraffic':
      case 'coupang-traffic':
      case 'ctraffic':
        return CampaignServiceType.COUPANG_TRAFFIC;
      
      case 'coupangfakesale':
      case 'coupang-fakesale':
      case 'cfakesale':
        return CampaignServiceType.COUPANG_FAKESALE;
      
      default:
        return CampaignServiceType.NAVER_TRAFFIC; // 기본값
    }
  }
  
  // 그 외의 경우 기본값
  return CampaignServiceType.NAVER_TRAFFIC;
};

/**
 * 다양한 소스에서 최종 서비스 타입을 결정하는 함수
 * 
 * @param sources 소스 객체 (우선순위 순서대로 확인됨)
 * @returns 결정된 서비스 타입
 */
export const resolveServiceType = ({
  campaign,
  serviceCode,
  pathname,
  category
}: {
  campaign?: { service_type?: string | CampaignServiceType, campaign_name?: string },
  serviceCode?: string | CampaignServiceType,
  pathname?: string,
  category?: string | null
}): CampaignServiceType => {
  // 디버깅 위한 결정 과정 기록
  const decisionPath: string[] = [];
  let result: CampaignServiceType = CampaignServiceType.NAVER_TRAFFIC;
  let decided = false;
  
  // 1. 캠페인 객체의 service_type (가장 높은 우선순위)
  if (campaign?.service_type) {
    result = normalizeServiceType(campaign.service_type);
    decisionPath.push(`1-캠페인객체: ${campaign.service_type} -> ${result}`);
    decided = true;
  }
  
  // 2. 캠페인 이름에서 추출 (특수 케이스를 위한 추가 검사)
  if (!decided && campaign?.campaign_name) {
    const serviceTypeFromName = getServiceTypeFromCampaignName(campaign.campaign_name);
    if (serviceTypeFromName) {
      result = serviceTypeFromName;
      decisionPath.push(`2-캠페인이름: ${campaign.campaign_name} -> ${result}`);
      decided = true;
    }
  }
  
  // 3. 카테고리에서 추출 (특수 케이스)
  if (!decided && category) {
    const serviceTypeFromCategory = getServiceTypeFromCampaignName(category);
    if (serviceTypeFromCategory) {
      result = serviceTypeFromCategory;
      decisionPath.push(`3-카테고리: ${category} -> ${result}`);
      decided = true;
    }
  }
  
  // 4. 전달된 serviceCode 사용
  if (!decided && serviceCode) {
    result = normalizeServiceType(serviceCode);
    decisionPath.push(`4-서비스코드: ${serviceCode} -> ${result}`);
    decided = true;
  }
  
  // 5. URL 경로에서 추출
  if (!decided && pathname) {
    const serviceTypeFromUrl = getServiceTypeFromUrl(pathname);
    if (serviceTypeFromUrl) {
      result = serviceTypeFromUrl;
      decisionPath.push(`5-URL: ${pathname} -> ${result}`);
      decided = true;
    }
  }
  
  // 6. 모든 시도 실패 시 기본값
  if (!decided) {
    result = CampaignServiceType.NAVER_TRAFFIC;
    decisionPath.push(`6-기본값: -> ${result}`);
  }
  
  // 디버깅은 필요한 경우 주석 해제
  /*
  console.log("서비스 타입 결정 경로:", {
    result,
    decisionPath,
    inputs: {
      campaignServiceType: campaign?.service_type,
      campaignName: campaign?.campaign_name,
      serviceCode,
      pathname,
      category
    }
  });
  */
  
  return result;
};

/**
 * 서비스 타입을 문자열로 변환
 * 
 * @param serviceType 서비스 타입
 * @returns 문자열로 변환된 서비스 타입
 */
export const serviceTypeToString = (serviceType: CampaignServiceType | string): string => {
  if (typeof serviceType === 'string') {
    return serviceType;
  }
  return serviceType.toString();
};