// 광고 캠페인 데이터 타입 정의
export interface IAdCampaignsContentItem {
  logo: string;
  logoSize?: string;
  title: string;
  description: string;
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
}