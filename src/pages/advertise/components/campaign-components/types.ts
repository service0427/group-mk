export interface Campaign {
  id: number;
  campaignName: string;
  logo?: string;
  status: string;
  serviceType: string;
}

export interface SlotItem {
  id: string;
  matId: string;
  productId: number;
  userId: string;
  status: string;
  submittedAt: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  userReason: string | null; // 사용자 메모 필드
  inputData: {
    productName: string;
    mid: string;
    url: string;
    keywords: string[];
  };
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
}

export interface CampaignListItem {
  id: number;
  campaignName: string;
}
