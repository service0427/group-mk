import { IAdCampaignsContentItem } from './adCampaignTypes';

// 샘플 캠페인 데이터
export const sampleCampaigns: IAdCampaignsContentItem[] = [
  {
    logo: 'lion.svg',
    logoSize: '50px',
    title: '라이언',
    description: '4가지 방식을 복합하여 진행하는 고급형 캠페인(1)',
    status: {
      variant: 'badge-primary',
      label: '진행 중'
    },
    statistics: [
      {
        total: '60',
        description: '🚀상승효율'
      },
      {
        total: '3',
        description: '📌추가로직'
      },
      {
        total: '100',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-warning',
      value: 100
    }
  },
  {
    logo: 'crocodile.svg',
    logoSize: '50px',
    title: '크로커다일',
    description: '3가지 방식을 복합하여 진행하는 고급형 캠페인(2)',
    status: {
      variant: 'badge-primary',
      label: '진행 중'
    },
    statistics: [
      {
        total: '55',
        description: '🚀상승효율'
      },
      {
        total: '2',
        description: '📌추가로직'
      },
      {
        total: '100',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-success',
      value: 100
    }
  },
  {
    logo: 'flamingo.svg',
    logoSize: '50px',
    title: '플라밍고',
    description: '2가지 방식을 복합하여 진행하는 고급형 캠페인(3)',
    status: {
      variant: 'badge-primary',
      label: '진행 중'
    },
    statistics: [
      {
        total: '53',
        description: '🚀상승효율'
      },
      {
        total: '1',
        description: '📌추가로직'
      },
      {
        total: '100',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-danger',
      value: 100
    }
  },
  {
    logo: 'llama.svg',
    logoSize: '50px',
    title: '라마',
    description: '단일 방식으로 진행하는 기본형 캠페인(1)',
    status: {
      variant: 'badge-primary',
      label: '진행 중'
    },
    statistics: [
      {
        total: '40',
        description: '🚀상승효율'
      },
      {
        total: '100',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-dark',
      value: 100
    }
  },
  {
    logo: 'teddy-bear.svg',
    logoSize: '50px',
    title: '테디베어',
    description: '단일 방식으로 진행하는 기본형 캠페인(2)',
    status: {
      variant: 'badge-primary',
      label: '진행 중'
    },
    statistics: [
      {
        total: '39',
        description: '🚀상승효율'
      },
      {
        total: '100',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-info',
      value: 100
    }
  },
  {
    logo: 'dolphin.svg',
    logoSize: '50px',
    title: '돌고래',
    description: '단일 방식으로 진행하는 기본형 캠페인(3)',
    status: {
      variant: 'badge-primary',
      label: '진행 중'
    },
    statistics: [
      {
        total: '39',
        description: '🚀상승효율'
      },
      {
        total: '100',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-primary',
      value: 100
    }
  },
  {
    logo: 'pelican.svg',
    logoSize: '50px',
    title: '펠리컨',
    description: '단일 방식으로 진행하는 기본형 캠페인(4)',
    status: {
      variant: 'badge-gray-300',
      label: '준비중'
    },
    statistics: [
      {
        total: '-',
        description: '🚀상승효율'
      },
      {
        total: '50',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-secondary',
      value: 100
    }
  },
  {
    logo: 'elephant.svg',
    logoSize: '50px',
    title: '엘리펀트',
    description: '단일 방식으로 진행하는 기본형 캠페인(5)',
    status: {
      variant: 'badge-gray-300',
      label: '준비중'
    },
    statistics: [
      {
        total: '-',
        description: '🚀상승효율'
      },
      {
        total: '50',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-gray-3300',
      value: 100
    }
  },
  {
    logo: 'kangaroo.svg',
    logoSize: '50px',
    title: '캥거루',
    description: '단일 방식으로 진행하는 기본형 캠페인(6)',
    status: {
      variant: 'badge-gray-300',
      label: '준비중'
    },
    statistics: [
      {
        total: '-',
        description: '🚀상승효율'
      },
      {
        total: '50',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-gray-3300',
      value: 100
    }
  },
  {
    logo: 'giraffe.svg',
    logoSize: '50px',
    title: '지라프',
    description: '단일 방식으로 진행하는 기본형 캠페인(7)',
    status: {
      variant: 'badge-gray-300',
      label: '준비중'
    },
    statistics: [
      {
        total: '-',
        description: '🚀상승효율'
      },
      {
        total: '50',
        description: '🧺최소수량'
      },
      {
        total: '22:00',
        description: '⏱️접수마감'
      }
    ],
    progress: {
      variant: 'progress-gray-3300',
      value: 100
    }
  }
];

// 추후 Supabase에서 데이터를 가져오는 함수
export const getCampaignsData = async (): Promise<IAdCampaignsContentItem[]> => {
  // 여기에 Supabase 연동 코드 작성
  // 현재는 샘플 데이터를 반환
  return sampleCampaigns;
};

// 특정 서비스에 대한 캠페인 데이터만 필터링하여 가져오는 함수
export const getServiceCampaignsData = async (
  serviceType: string
): Promise<IAdCampaignsContentItem[]> => {
  // 여기에 Supabase를 이용한 필터링 로직 작성
  // 현재는 모든 샘플 데이터를 반환
  return sampleCampaigns;
};