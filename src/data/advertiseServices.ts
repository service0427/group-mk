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
  ohouse: {
    traffic: {
      name: "오늘의집 트래픽",
      description: "오늘의집을 통한 사이트 트래픽 증가 마케팅",
      features: [
        {
          title: "인테리어 콘텐츠 연계",
          description: "인테리어 컨텐츠와 연계해 자연스럽게 제품 노출",
          icon: "home"
        },
        {
          title: "특정 고객 접근",
          description: "인테리어와 쇼퍼홀릭에 관심있는 고객층에게 직접 접근",
          icon: "users"
        }
      ]
    }
  }
};

// 서비스 데이터 조회 함수
export const getServiceData = (
  platform: string, 
  type: string, 
  subservice?: string
): ServiceData | null => {
  try {
    if (subservice) {
      return serviceData[platform][subservice][type];
    }
    return serviceData[platform][type];
  } catch (error) {
    console.log( error );
    console.error(`Service data not found for ${platform}/${subservice}/${type}`);
    return null;
  }
};

// URL 경로를 Supabase의 serviceTypeCode로 변환하는 함수
export const getServiceTypeFromPath = (
  platform: string,
  type: string,
  subservice?: string
): string => {
  console.log('getServiceTypeFromPath:', {platform, type, subservice});
  
  if (platform === 'naver' && subservice === 'shopping' && type === 'traffic') {
    return 'NaverShopTraffic';
  } else if (platform === 'naver' && subservice === 'place' && type === 'traffic') {
    return 'NaverPlaceTraffic';
  } else if (platform === 'naver' && subservice === 'place' && type === 'save') {
    return 'NaverPlaceSave';
  } else if (platform === 'naver' && subservice === 'place' && type === 'share') {
    return 'NaverPlaceShare';
  } else if (platform === 'naver' && type === 'auto') {
    return 'NaverAuto';
  } else if (platform === 'naver' && type === 'traffic') {
    return 'NaverTraffic';
  } else if (platform === 'coupang' && type === 'traffic') {
    return 'CoupangTraffic';
  } else if (platform === 'ohouse' && type === 'traffic') {
    return 'OhouseTraffic';
  }
  
  // 일치하는 서비스 타입이 없는 경우
  console.error('No matching service type for:', {platform, type, subservice});
  return '';
};

// 기존 하드코딩 캠페인 데이터 조회 함수 (호환성 유지)
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
    
    // 빈 캠페인 배열 반환 (백업 데이터 사용 안함)
    return {
      serviceData: serviceInfo,
      campaigns: []
    };
  } catch (error) {
    console.log(error);
    console.error(`Campaign data not found for ${platform}/${subservice}/${type}`);
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
      console.error('Service info not found');
      return null;
    }

    // supabase 서비스 타입 코드 매핑
    const serviceTypeCode = getServiceTypeFromPath(platform, type, subservice);
    
    if (!serviceTypeCode) {
      console.error('Service type code not found for the given path');
      return null;
    }

    // supabase에서 해당 서비스 타입의 캠페인 가져오기
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('service_type', serviceTypeCode)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching campaign data:', error);
      return null;
    }

    // 데이터가 없으면 빈 배열 반환
    if (!data || data.length === 0) {
      console.warn('No data found in Supabase');
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
    console.error('Error in fetchRealCampaignData:', error);
    return null;
  }
};
