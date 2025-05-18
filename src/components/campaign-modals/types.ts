// 캠페인 모달 관련 공통 타입 정의
export interface ICampaign {
  id: string;
  campaignName: string;
  description: string;
  logo: string;
  efficiency: string;
  minQuantity: string;
  deadline: string;
  status: string | {
    label: string;
    color: string;
    status?: string;
  };
  originalData?: any;
  additionalLogic?: string;
  detailedDescription?: string;
  unitPrice?: string;
  bannerImage?: string;
  rejectionReason?: string;
  // Additional fields from original ICampaign in CampaignContent.tsx
  serviceType?: string; // 서비스 유형
  matId?: string; // 매트 ID
  serviceName?: string; // 서비스 이름
  updatedAt?: string; // 업데이트 시간
  additionalFields?: any; // 추가 필드 (CampaignPreviewModal에서 사용)
}

// 확장된 캠페인 인터페이스
export interface ExtendedCampaign extends ICampaign {
  // These fields are already in ICampaign but are listed here for backward compatibility
  additionalLogic?: string;
  detailedDescription?: string;
  unitPrice?: string;
  bannerImage?: string;
  rejectionReason?: string;
  serviceType?: string;
}

// 캠페인 상태 관련 유틸리티 함수
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pending': return '준비중';
    case 'pause': return '표시안함';
    case 'waiting_approval': return '승인 대기중';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

// 상태값에 따른 색상 반환
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'success';
    case 'pause': return 'warning';
    case 'pending': return 'info';
    case 'completed': return 'primary';
    case 'rejected': return 'danger';
    case 'waiting_approval': return 'primary';
    default: return 'info';
  }
};