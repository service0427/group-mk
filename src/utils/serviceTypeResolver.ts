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
        // 모든 캠페인 타입에서 URL 패턴 일치 확인 (config 기반)
        for (const campaign of CAMPAIGNS) {
          for (const type of campaign.types) {
            const typeCode = type.code;
            // URL에 사용될 수 있는 형식으로 변환 (CamelCase → kebab-case)
            const urlPattern = typeCode
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .toLowerCase();
            
            if (serviceTypeStr === urlPattern) {
              return typeCode as CampaignServiceType;
            }
          }
        }
        
        // 직접 매핑 처리 - 특별 케이스
        if (serviceTypeStr === 'naver-shopping-traffic') {
          return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
        }
        
        if (serviceTypeStr === 'naver-auto') {
          return CampaignServiceType.NAVER_AUTO;
        }
        
        // URL 패턴 분석
        const parts = serviceTypeStr.split('-');
        
        if (parts.length === 2) {
          // platform-type (예: naver-traffic)
          return getServiceTypeFromPath(parts[0], parts[1]);
        } else if (parts.length === 3) {
          // 세 부분으로 나눠진 URL (예: naver-shopping-traffic)
          if (parts[0] === 'naver' && parts[1] === 'shopping' && parts[2] === 'traffic') {
            return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
          }
          
          // 일반적인 3단계 구조 처리
          // 맞는 순서로 파라미터 전달 (platform, type, subservice)
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
 * (URL 기반으로만 체크하도록 수정되어 더 이상 사용하지 않음)
 * 
 * @param campaignName 캠페인 이름
 * @returns 서비스 타입 또는 null
 */
export const getServiceTypeFromCampaignName = (campaignName: string): CampaignServiceType | null => {
  // URL 기반으로만 검사하므로 항상 null 반환
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
    // 1. 특별 케이스: 네이버 쇼핑 트래픽 (URL 패턴 체크 기반)
    if (serviceCode === 'naver-shopping-traffic') {
      return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
    }
    
    // 2. 정확한 열거형 값과 일치하는지 확인
    const exactMatch = Object.values(CampaignServiceType).find(
      type => type === serviceCode
    );
    if (exactMatch) {
      return exactMatch;
    }
    
    // 3. 대소문자 무시하고 일치하는지 확인
    const caseInsensitiveMatch = Object.values(CampaignServiceType).find(
      type => type.toLowerCase() === serviceCode.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch;
    }
    
    // 4. URL 형식으로 변환된 형태 확인 (kebab-case)
    for (const type of Object.values(CampaignServiceType)) {
      const kebabCase = type
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
      
      if (kebabCase === serviceCode.toLowerCase()) {
        return type;
      }
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
  
  // 1. URL 경로에서 추출 (최우선 - 모든 결정은 URL 기반으로만 수행)
  if (pathname) {
    // 특별 케이스: URL에 naver-shopping-traffic이 명시적으로 포함
    if (pathname.includes('naver-shopping-traffic')) {
      result = CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
      decided = true;
    } else {
      // 일반적인 URL 경로 파싱
      const serviceTypeFromUrl = getServiceTypeFromUrl(pathname);
      if (serviceTypeFromUrl) {
        result = serviceTypeFromUrl;
        decided = true;
      }
    }
  }
  
  // 2. 전달된 serviceCode 사용 (URL이 없거나 URL에서 타입을 추출할 수 없는 경우)
  if (!decided && serviceCode) {
    result = normalizeServiceType(serviceCode);
    decided = true;
  }
  
  // 3. 캠페인 객체에서 service_type 사용 (fallback)
  if (!decided && campaign?.service_type) {
    result = normalizeServiceType(campaign.service_type);
    decided = true;
  }
  
  // 4. 모든 시도 실패 시 기본값
  if (!decided) {
    result = CampaignServiceType.NAVER_TRAFFIC;
  }
  
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
  // toString() 메서드를 직접 호출하지 않고 String 생성자 사용
  return String(serviceType);
};