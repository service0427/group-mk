import { toAbsoluteUrl } from './Assets';

/**
 * 캠페인 데이터 인터페이스
 */
export interface CampaignData {
  id: string | number;
  campaign_name: string;
  description?: string;
  logo?: string;
  efficiency?: string | number;
  min_quantity?: string | number;
  deadline?: string;
  unit_price?: string | number;
  additional_logic?: string | number;
  status: string;
}

/**
 * 포맷된 캠페인 데이터 인터페이스
 */
export interface FormattedCampaignData {
  logo: string;
  logoSize?: string; // 옵셔널로 변경
  title: string;
  description: string;
  status: {
    variant: string;
    label: string;
  };
  statistics: Array<{ 
    total: string; 
    description: string;
  }>;
  progress?: { // 옵셔널로 변경
    variant: string;
    value: number;
  };
}

/**
 * 캠페인 상세정보 인터페이스
 */
export interface CampaignDetailData {
  id: string;
  campaignName: string;
  description: string;
  logo: string;
  efficiency: string;
  minQuantity: string;
  deadline: string;
  unitPrice: string;
  additionalLogic: string;
  detailedDescription?: string;
  status: {
    label: string;
    color: string;
  };
}

/**
 * 상태값에 따른 배지 클래스 반환
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'active': return 'badge-success';
    case 'pause': return 'badge-warning';
    case 'pending': return 'badge-info';
    case 'completed': return 'badge-primary';
    case 'rejected': return 'badge-danger';
    default: return 'badge-gray-300';
  }
};

/**
 * 상태값에 따른 표시 텍스트 반환
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pause': return '표시안함';
    case 'pending': return '준비중';
    case 'completed': return '완료됨';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

/**
 * 상태값에 따른 배지 색상 클래스 반환
 */
export const getStatusColorClass = (variant: string): string => {
  switch (variant) {
    case 'badge-success': return 'success';
    case 'badge-warning': return 'warning';
    case 'badge-info': return 'info';
    case 'badge-primary': return 'primary';
    case 'badge-danger': return 'danger';
    default: return 'gray-300';
  }
};

/**
 * 단위가 없는 값에 단위 추가
 */
export const addUnit = (value: string | number | undefined, unit: string): string => {
  if (value === undefined || value === null) return '-';
  
  const stringValue = String(value);
  if (stringValue === '-') return '-';
  if (stringValue.includes(unit)) return stringValue;
  return `${stringValue}${unit}`;
};

/**
 * 이미지 URL 포맷팅
 */
export const formatImageUrl = (logo: string | undefined): string => {
  if (!logo) return toAbsoluteUrl('/media/animal/svg/lion.svg');
  if (logo.startsWith('/media')) return toAbsoluteUrl(logo);
  return toAbsoluteUrl(`/media/${logo}`);
};

// 사용 가능한 프로그레스 바 색상 정의
const PROGRESS_VARIANTS = [
  'progress-primary',
  'progress-success',
  'progress-info',
  'progress-warning',
  'progress-danger'
];

/**
 * 상태와 인덱스에 따라 프로그레스 바 색상 반환
 */
export const getProgressVariant = (status: string, index: number): string => {
  // 준비중 상태면 회색 프로그레스 바 반환
  if (status === 'pending') {
    return 'progress-gray-300'; // 회색 프로그레스 바
  }
  
  // 반려됨 상태면 연한 빨간색 프로그레스 바 반환
  if (status === 'rejected') {
    return 'progress-danger-light';
  }
  
  // 그 외 상태는 다양한 색상 순환 사용
  const variantIndex = index % PROGRESS_VARIANTS.length;
  return PROGRESS_VARIANTS[variantIndex];
};

/**
 * 캠페인 데이터를 화면에 표시할 형식으로 변환
 */
export const formatCampaignData = (campaign: CampaignData, index: number = 0): FormattedCampaignData => {
  // 기본 통계 항목 배열 생성
  const statistics = [
    {
      total: addUnit(campaign.efficiency, '%'),
      description: '🚀상승효율'
    },
    {
      total: addUnit(campaign.unit_price, '원'),
      description: '💰건당단가'
    },
    {
      total: addUnit(campaign.min_quantity, '개'),
      description: '🧺최소수량'
    },
    {
      total: campaign.deadline || '22:00',
      description: '⏱️접수마감'
    }
  ];
  
  // 추가로직이 0이 아닌 경우에만 통계 항목에 추가
  if (campaign.additional_logic && 
      Number(campaign.additional_logic) !== 0 && 
      campaign.additional_logic !== '0' && 
      campaign.additional_logic !== '-') {
    statistics.splice(2, 0, {
      total: addUnit(campaign.additional_logic, '개'),
      description: '📌추가로직'
    });
  }

  return {
    logo: campaign.logo || '/media/animal/svg/lion.svg',
    logoSize: '50px',
    title: campaign.campaign_name,
    description: campaign.description || '',
    status: {
      variant: getStatusBadgeClass(campaign.status),
      label: getStatusLabel(campaign.status)
    },
    statistics: statistics,
    progress: {
      variant: getProgressVariant(campaign.status, index),
      value: 100
    }
  };
};

/**
 * 캠페인 데이터를 상세보기 모달 형식으로 변환
 */
export const formatCampaignDetailData = (campaign: FormattedCampaignData): CampaignDetailData => {
  // 추가로직 정보 가져오기
  const additionalLogic = campaign.statistics.find(stat => stat.description.includes('추가로직'));
  
  return {
    id: "",
    campaignName: campaign.title,
    description: campaign.description,
    logo: campaign.logo,
    efficiency: campaign.statistics.find(stat => stat.description.includes('상승효율'))?.total || '0%',
    minQuantity: campaign.statistics.find(stat => stat.description.includes('최소수량'))?.total || '0개',
    deadline: campaign.statistics.find(stat => stat.description.includes('접수마감'))?.total || '-',
    unitPrice: campaign.statistics.find(stat => stat.description.includes('건당단가'))?.total || '0원',
    // 추가로직이 있는 경우에만 값 설정
    additionalLogic: additionalLogic ? additionalLogic.total : '없음',
    // 상세 설명 추가
    detailedDescription: campaign.description,
    status: {
      label: campaign.status.label,
      color: campaign.status.variant
    }
  };
};