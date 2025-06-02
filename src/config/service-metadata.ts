import { CampaignServiceType } from '@/components/campaign-modals/types';

// 서비스별 메타데이터 정의
export interface ServiceMetadata {
  requiresKeyword: boolean;
}

export const SERVICE_METADATA: Record<string, ServiceMetadata> = {
  [CampaignServiceType.NAVER_AUTO]: {
    requiresKeyword: true
  },
  [CampaignServiceType.NAVER_SHOPPING_RANK]: {
    requiresKeyword: true
  },
  [CampaignServiceType.NAVER_PLACE_RANK]: {
    requiresKeyword: true
  },
  [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: {
    requiresKeyword: true
  },
  [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: {
    requiresKeyword: false
  },
  [CampaignServiceType.NAVER_PLACE_TRAFFIC]: {
    requiresKeyword: true
  },
  [CampaignServiceType.NAVER_PLACE_SAVE]: {
    requiresKeyword: false
  },
  [CampaignServiceType.NAVER_PLACE_SHARE]: {
    requiresKeyword: false
  },
  [CampaignServiceType.COUPANG_TRAFFIC]: {
    requiresKeyword: true
  },
  [CampaignServiceType.COUPANG_FAKESALE]: {
    requiresKeyword: false
  }
};

// 헬퍼 함수: 서비스가 키워드를 필요로 하는지 확인
export const requiresKeyword = (serviceType: string): boolean => {
  return SERVICE_METADATA[serviceType]?.requiresKeyword ?? false;
};