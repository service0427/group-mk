// 광고 서비스 데이터의
import { supabase } from '@/supabase';

export interface ServiceData {
  name: string;
  description: string;
  features: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  benefits?: Array<{
    title: string;
    description: string;
  }>;
  imagePath?: string;
}

export interface CampaignData {
  serviceData: ServiceData;
  campaigns: Array<any>;
}

// 서비스 데이터 계층 구조
// 패턴: serviceData[platform][subservice?][type]
export const serviceData: Record<string, any> = {
  ntraffic: {
    name: "네이버 트래픽",
    description: "네이버 검색과 배너를 통한 사이트 트래픽 증가 마케팅",
    features: [
      {
        title: "키워드 광고",
        description: "관련 키워드 검색시 상위 노출 광고",
        icon: "type"
      },
      {
        title: "배너 광고",
        description: "네이버 서비스에 배너를 통한 노출",
        icon: "image"
      }
    ]
  },
  coupang: {
    traffic: {
      name: "쿠팡 트래픽",
      description: "쿠팡 마켓을 통해 사이트 트래픽을 증가시키세요.",
      features: [
        {
          title: "고객 타겟팅",
          description: "쿠팡 사용자의 쇼핑 활동 패턴을 분석해 타겟팅",
          icon: "target"
        },
        {
          title: "제품 연계 광고",
          description: "구매 가능성이 높은 관련제품에 노출",
          icon: "link"
        },
        {
          title: "실시간 리포트",
          description: "광고 효과를 실시간으로 확인하고 최적화",
          icon: "chart"
        }
      ],
      benefits: [
        {
          title: "높은 전환율",
          description: "구매 의도가 명확한 고객에게 광고 노출"
        },
        {
          title: "브랜드 인지도 상승",
          description: "대규모 쿠팡 사용자에게 브랜드 노출"
        }
      ],
      imagePath: "/images/coupang-traffic.jpg"
    }
  },
  naver: {
    auto: {
      name: "네이버 자동완성",
      description: "네이버 검색창 자동완성에 파워링크 노출시키는 마케팅 솔루션",
      features: [
        {
          title: "파워풀 노출",
          description: "관련 검색어 입력 시 자동완성에 브랜드나 제품이 노출",
          icon: "key"
        },
        {
          title: "브랜드 인지도 상승",
          description: "검색 시작 단계에서 브랜드 인식 유도",
          icon: "trending-up"
        }
      ]
    },
    place: {
      save: {
        name: "네이버 플레이스 저장",
        description: "네이버 플레이스에 매장을 저장하도록 유도하는 마케팅",
        features: [
          {
            title: "재방문 유도",
            description: "고객이 매장을 저장하도록 하여 재방문율 증가",
            icon: "bookmark"
          },
          {
            title: "타겟 마케팅",
            description: "저장한 고객에게 맞춤형 정보 제공 가능",
            icon: "target"
          }
        ]
      },
      share: {
        name: "네이버 플레이스 공유",
        description: "네이버 플레이스에서 매장 정보를 공유하도록 유도하는 마케팅",
        features: [
          {
            title: "입소문 마케팅",
            description: "사용자간 공유를 통한 자연스러운 정보 확산",
            icon: "share"
          },
          {
            title: "신규 고객 유치",
            description: "기존 고객의 네트워크를 통한 신규 고객 확보",
            icon: "users"
          }
        ]
      },
      traffic: {
        name: "네이버 플레이스 트래픽",
        description: "네이버 플레이스를 통한 사이트 트래픽 증가 마케팅",
        features: [
          {
            title: "사이트 연결",
            description: "네이버 플레이스 정보에서 사이트로 직접 연결",
            icon: "external-link"
          },
          {
            title: "방문 전환",
            description: "매장 정보 확인 후 사이트 방문으로 전환",
            icon: "refresh-cw"
          }
        ]
      },
      rank: {
        name: "네이버 플레이스 순위확인",
        description: "네이버 플레이스에서 매장의 검색 순위를 실시간으로 확인하고 모니터링",
        features: [
          {
            title: "지역별 순위 추적",
            description: "지역별, 카테고리별 매장 순위를 실시간으로 모니터링",
            icon: "map-pin"
          },
          {
            title: "경쟁업체 분석",
            description: "동일 지역 경쟁업체의 순위 변동을 추적",
            icon: "users"
          },
          {
            title: "리뷰 영향도 분석",
            description: "리뷰와 평점이 순위에 미치는 영향을 분석",
            icon: "message-circle"
          }
        ]
      }
    },
    shopping: {
      traffic: {
        name: "네이버 쇼핑 트래픽",
        description: "네이버 쇼핑을 통한 사이트 트래픽 증가 마케팅",
        features: [
          {
            title: "제품 노출 최적화",
            description: "네이버 쇼핑에서 제품 노출을 극대화하여 트래픽 유도",
            icon: "maximize"
          },
          {
            title: "검색 알고리즘 최적화",
            description: "네이버 쇼핑 검색 결과에서 상위 노출을 위한 최적화",
            icon: "search"
          }
        ]
      },
      fakesale: {
        name: "네이버 쇼핑 가구매",
        description: "네이버 쇼핑에서 가상 구매를 통한 인기도 상승 마케팅",
        features: [
          {
            title: "인기도 상승",
            description: "상품의 판매량과 인기도를 높여 노출 증가",
            icon: "trending-up"
          },
          {
            title: "신뢰도 향상",
            description: "구매 후기와 평점을 통한 상품 신뢰도 향상",
            icon: "star"
          }
        ]
      },
      rank: {
        name: "네이버 쇼핑 순위확인",
        description: "네이버 쇼핑에서 상품의 검색 순위를 실시간으로 확인하고 모니터링",
        features: [
          {
            title: "실시간 순위 추적",
            description: "주요 키워드별 상품 순위를 실시간으로 모니터링",
            icon: "activity"
          },
          {
            title: "경쟁사 분석",
            description: "경쟁 상품의 순위 변동을 추적하여 전략 수립",
            icon: "bar-chart"
          },
          {
            title: "순위 변동 알림",
            description: "순위 변동시 즉시 알림을 받아 빠른 대응 가능",
            icon: "bell"
          }
        ]
      }
    },
    traffic: {
      name: "네이버 트래픽",
      description: "네이버 검색과 배너를 통한 사이트 트래픽 증가 마케팅",
      features: [
        {
          title: "키워드 광고",
          description: "관련 키워드 검색시 상위 노출 광고",
          icon: "type"
        },
        {
          title: "배너 광고",
          description: "네이버 서비스에 배너를 통한 노출",
          icon: "image"
        }
      ]
    }
  },
};

// 서비스 데이터 조회 함수
export const getServiceData = (
  platform: string,
  type: string,
  subservice?: string
): ServiceData | null => {
  try {
    // // ntraffic 특수 처리 (platform이 ntraffic인 경우)
    // if (platform === 'ntraffic') {
    //   return serviceData[platform];
    // }

    if (subservice) {
      return serviceData[platform][subservice][type];
    }
    return serviceData[platform][type];
  } catch (error) {
    
    
    return null;
  }
};

import { CampaignServiceType } from '@/components/campaign-modals/types';

// URL 경로를 CampaignServiceType으로 변환하는 함수
// 참고: 이 함수는 원래 types.ts에 정의된 것을 재사용합니다.
// 하지만 여기서는 호환성을 위해 간단한 정의를 유지합니다.
export const getServiceTypeFromPath = (
  platform: string,
  type: string,
  subservice?: string
): CampaignServiceType => {
  // 새로운 URL 패턴 처리 (naver-shopping-traffic 같은 단일 문자열 형식)
  if (type && type.includes('-')) {
    const parts = type.split('-');
    if (parts.length === 2) {
      // platform-type 형식 (naver-traffic)
      return getServiceTypeFromPath(platform, parts[1]);
    } else if (parts.length === 3) {
      // platform-subservice-type 형식 (naver-shopping-traffic)
      return getServiceTypeFromPath(parts[0], parts[2], parts[1]);
    }
  }

  // 기존 패턴 처리
  if (platform === 'naver' && subservice === 'shopping' && type === 'traffic') {
    return CampaignServiceType.NAVER_SHOPPING_TRAFFIC;
  } else if (platform === 'naver' && subservice === 'shopping' && type === 'fakesale') {
    return CampaignServiceType.NAVER_SHOPPING_FAKESALE;
  } else if (platform === 'naver' && subservice === 'shopping' && type === 'rank') {
    return CampaignServiceType.NAVER_SHOPPING_RANK;
  } else if (platform === 'naver' && subservice === 'place' && type === 'traffic') {
    return CampaignServiceType.NAVER_PLACE_TRAFFIC;
  } else if (platform === 'naver' && subservice === 'place' && type === 'save') {
    return CampaignServiceType.NAVER_PLACE_SAVE;
  } else if (platform === 'naver' && subservice === 'place' && type === 'share') {
    return CampaignServiceType.NAVER_PLACE_SHARE;
  } else if (platform === 'naver' && subservice === 'place' && type === 'rank') {
    return CampaignServiceType.NAVER_PLACE_RANK;
  } else if (platform === 'naver' && type === 'auto') {
    return CampaignServiceType.NAVER_AUTO;
  } else if (platform === 'naver' && type === 'traffic') {
    return CampaignServiceType.NAVER_SHOPPING_RANK;
  } else if (platform === 'coupang' && type === 'traffic') {
    return CampaignServiceType.COUPANG_TRAFFIC;
  } else if (platform === 'coupang' && type === 'fakesale') {
    return CampaignServiceType.COUPANG_FAKESALE;
  }

  // 일치하는 서비스 타입이 없는 경우 기본값 반환
  return CampaignServiceType.NAVER_SHOPPING_RANK;
};

// 캠페인 데이터 조회 함수
export const getCampaignData = (
  platform: string,
  type: string,
  subservice?: string
): CampaignData | null => {
  try {
    // 서비스 정보 가져오기
    const serviceInfo = getServiceData(platform, type, subservice);
    if (!serviceInfo) {
      return null;
    }

    // 여기서는 서비스 데이터만 반환하고 캠페인 정보는 컴포넌트에서 직접 가져오게 함
    // 이렇게 하면 데이터베이스 조회 실패 시 컴포넌트에서 오류 처리 가능
    return {
      serviceData: serviceInfo,
      campaigns: []
    };
  } catch (error) {
    return null;
  }
};

// 실제 Supabase에서 캠페인 데이터를 가져오는 함수
export const fetchRealCampaignData = async (
  platform: string,
  type: string,
  subservice?: string
): Promise<CampaignData | null> => {
  try {
    // 서비스 정보 가져오기
    const serviceInfo = getServiceData(platform, type, subservice);
    if (!serviceInfo) {
      
      return null;
    }

    // URL 경로에서 서비스 타입 코드 가져오기
    const serviceType = getServiceTypeFromPath(platform, type, subservice);

    // supabase에서 해당 서비스 타입의 캠페인 가져오기
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('service_type', serviceType)
      .order('id', { ascending: true });

    if (error) {
      
      return null;
    }

    // 데이터가 없으면 빈 배열 반환
    if (!data || data.length === 0) {
      
      return {
        serviceData: serviceInfo,
        campaigns: []
      };
    }

    // 가져온 데이터를 원하는 포맷으로 변환
    const formattedCampaigns = data.map(campaign => ({
      id: campaign.id.toString(),
      name: campaign.campaign_name,
      status: campaign.status as 'active' | 'paused' | 'completed',
      description: campaign.description || '',
      logo: campaign.logo,
      efficiency: campaign.efficiency ? `${campaign.efficiency}%` : '-',
      minQuantity: campaign.min_quantity ? `${campaign.min_quantity}개` : '-',
      deadline: campaign.deadline || '22:00',
      unitPrice: campaign.unit_price || 100,
      additionalLogic: campaign.additional_logic,
      originalData: campaign
    }));

    return {
      serviceData: serviceInfo,
      campaigns: formattedCampaigns
    };
  } catch (error) {
    
    return null;
  }
};
