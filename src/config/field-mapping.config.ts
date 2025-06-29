import { CampaignServiceType } from '@/components/campaign-modals/types';

// 서비스별 기본 필드 매핑 템플릿
export const DEFAULT_FIELD_MAPPING_TEMPLATES: Record<string, {
  keyword: string[];
  product_id: string[];
  title: string[];
  link: string[];
  rank: string[];
}> = {
  [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: {
    keyword: ['검색키워드', '키워드', 'keyword', '검색어'],
    product_id: ['MID', '상품코드', '상품번호', 'mid', '제품코드'],
    title: ['상품명', '제품명', 'product', '상품이름'],
    link: ['상품URL', 'url', '링크', '상품주소', 'link'],
    rank: ['현재순위', '순위', 'rank', '랭킹']
  },
  [CampaignServiceType.NAVER_SHOPPING_RANK]: {
    keyword: ['키워드', '검색어', 'keyword', '검색키워드'],
    product_id: ['상품코드', 'MID', 'productId', '제품번호'],
    title: ['상품명', '상품이름', 'title', '제품명'],
    link: ['URL', '상품링크', 'link', '링크'],
    rank: ['순위', '랭크', 'rank', '현재순위']
  },
  [CampaignServiceType.NAVER_PLACE_RANK]: {
    keyword: ['검색키워드', '키워드', 'keyword', '검색어'],
    product_id: ['업체코드', 'PlaceID', 'placeId', '업체번호', 'place_id'],
    title: ['업체명', '상호명', 'placeName', '가게이름', '업체이름'],
    link: ['업체URL', 'url', '링크', '업체링크', 'placeUrl'],
    rank: ['순위', '랭킹', 'rank', '현재순위']
  },
  [CampaignServiceType.COUPANG_TRAFFIC]: {
    keyword: ['검색키워드', '키워드', 'keyword', '검색어'],
    product_id: ['상품코드', 'ASIN', 'productId', '제품번호'],
    title: ['상품명', '제품명', 'title', '상품이름'],
    link: ['상품URL', 'url', '링크', '상품주소'],
    rank: ['순위', '랭크', 'rank', '현재순위']
  }
};

// 필드 매핑 신뢰도 계산 함수
export function calculateMappingConfidence(fieldName: string, patterns: string[]): number {
  const normalizedFieldName = fieldName.toLowerCase().replace(/[_\-\s]/g, '');
  
  for (const pattern of patterns) {
    const normalizedPattern = pattern.toLowerCase().replace(/[_\-\s]/g, '');
    
    // 완전 일치
    if (normalizedFieldName === normalizedPattern) {
      return 100;
    }
    
    // 부분 일치
    if (normalizedFieldName.includes(normalizedPattern) || normalizedPattern.includes(normalizedFieldName)) {
      return Math.round((normalizedPattern.length / Math.max(normalizedFieldName.length, normalizedPattern.length)) * 80);
    }
  }
  
  return 0;
}

// 자동 필드 매핑 생성 함수
export function generateAutoMapping(
  campaignFields: Array<{ fieldName: string }>,
  serviceType: string
): Record<string, { field: string; confidence: number }> {
  const templates = DEFAULT_FIELD_MAPPING_TEMPLATES[serviceType];
  if (!templates) return {};
  
  const results: Record<string, { field: string; confidence: number }> = {};
  
  // 각 순위 필드에 대해 가장 적합한 캠페인 필드 찾기
  Object.entries(templates).forEach(([rankingField, patterns]) => {
    let bestMatch = { field: '', confidence: 0 };
    
    campaignFields.forEach(({ fieldName }) => {
      const confidence = calculateMappingConfidence(fieldName, patterns);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { field: fieldName, confidence };
      }
    });
    
    if (bestMatch.field && bestMatch.confidence >= 50) { // 50% 이상만 제안
      results[rankingField] = bestMatch;
    }
  });
  
  return results;
}

// 순위 관련 서비스인지 확인
export function isRankingService(serviceType: string): boolean {
  return [
    CampaignServiceType.NAVER_SHOPPING_RANK,
    CampaignServiceType.NAVER_PLACE_RANK,
    CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
    CampaignServiceType.COUPANG_TRAFFIC
  ].includes(serviceType as CampaignServiceType);
}