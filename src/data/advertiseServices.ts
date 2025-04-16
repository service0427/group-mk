// 광고 서비스 데이터의
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
  campaigns: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed';
    budget: number;
    spent: number;
    startDate: string;
    endDate?: string;
    performance?: {
      impressions: number;
      clicks: number;
      conversions: number;
    };
  }>;
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

// 캠페인 데이터(하드코딩된 예시)
export const campaignData: Record<string, Array<any>> = {
  "coupang-traffic": [
    {
      id: "camp-001",
      name: "쿠팡 여름 프로모션",
      status: "active",
      budget: 500000,
      spent: 235000,
      startDate: "2025-04-01",
      endDate: "2025-06-30",
      performance: {
        impressions: 45600,
        clicks: 3200,
        conversions: 128
      }
    },
    {
      id: "camp-002",
      name: "신상품 출시 캠페인",
      status: "paused",
      budget: 300000,
      spent: 120000,
      startDate: "2025-03-15",
      endDate: "2025-04-15",
      performance: {
        impressions: 25800,
        clicks: 1840,
        conversions: 76
      }
    }
  ],
  "naver-auto": [
    {
      id: "camp-003",
      name: "브랜드명 자동완성 캠페인",
      status: "active",
      budget: 200000,
      spent: 85000,
      startDate: "2025-02-01",
      endDate: "2025-05-01",
      performance: {
        impressions: 188000,
        clicks: 5400,
        conversions: 210
      }
    }
  ],
  "naver-place-save": [
    {
      id: "camp-004",
      name: "매장 저장 유도 캠페인",
      status: "active",
      budget: 150000,
      spent: 37500,
      startDate: "2025-04-01",
      performance: {
        impressions: 12400,
        clicks: 1750,
        conversions: 420
      }
    }
  ],
  "naver-place-share": [
    {
      id: "camp-005",
      name: "친구 초대 이벤트",
      status: "completed",
      budget: 100000,
      spent: 100000,
      startDate: "2025-01-15",
      endDate: "2025-03-15",
      performance: {
        impressions: 34500,
        clicks: 4200,
        conversions: 380
      }
    }
  ],
  "naver-place-traffic": [
    {
      id: "camp-006",
      name: "네이버 플레이스 사이트 연결 캠페인",
      status: "active",
      budget: 250000,
      spent: 75000,
      startDate: "2025-03-10",
      performance: {
        impressions: 28700,
        clicks: 3650,
        conversions: 145
      }
    }
  ],
  "naver-shopping-traffic": [
    {
      id: "camp-007",
      name: "쇼핑 트래픽 최적화 캠페인",
      status: "active",
      budget: 450000,
      spent: 180000,
      startDate: "2025-02-15",
      performance: {
        impressions: 65400,
        clicks: 7820,
        conversions: 310
      }
    }
  ],
  "naver-traffic": [
    {
      id: "camp-008",
      name: "검색 키워드 광고",
      status: "active",
      budget: 350000,
      spent: 120000,
      startDate: "2025-03-01",
      performance: {
        impressions: 42000,
        clicks: 5600,
        conversions: 224
      }
    }
  ],
  "ohouse-traffic": [
    {
      id: "camp-009",
      name: "인테리어 특집 광고",
      status: "active",
      budget: 280000,
      spent: 95000,
      startDate: "2025-04-05",
      performance: {
        impressions: 31500,
        clicks: 4700,
        conversions: 156
      }
    }
  ]
};

// 캠페인 데이터 조회 함수
export const getCampaignData = (
  platform: string, 
  type: string, 
  subservice?: string
): CampaignData | null => {
  try {
    let key = `${platform}-${type}`;
    if (subservice) {
      key = `${platform}-${subservice}-${type}`;
    }
    
    const serviceInfo = getServiceData(platform, type, subservice);
    
    if (!serviceInfo || !campaignData[key]) {
      return null;
    }
    
    return {
      serviceData: serviceInfo,
      campaigns: campaignData[key]
    };
  } catch (error) {
    console.log( error )
    console.error(`Campaign data not found for ${platform}/${subservice}/${type}`);
    return null;
  }
};
