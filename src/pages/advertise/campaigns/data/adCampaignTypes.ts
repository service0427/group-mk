// 광고 캠페인 데이터 타입 정의
export interface IAdCampaignsContentItem {
  id?: string | number; // 캠페인 ID (DB에서 가져온 실제 ID)
  logo: string;
  logoSize?: string;
  title: string;
  description: string;
  detailedDescription?: string; // 추가: 상세 설명 필드 (옵셔널)
  status: {
    variant: string;
    label: string;
  };
  statistics: Array<{ 
    total: string; 
    description: string 
  }>;
  progress?: {
    variant: string;
    value: number;
  };
  originalData?: any; // 원본 데이터 전체 저장 (환불 설정 포함)
  rawId?: string | number; // 원본 ID - 모달에 전달할 때 사용
}