import { CampaignData } from '@/data/advertiseServices';

export interface CampaignTemplateProps {
  campaignData: CampaignData;
  introPath: string;
}

// 슬롯 데이터 인터페이스
export interface SlotItem {
  id: string;
  matId: string;
  productId: number;
  userId: string;
  status: string;
  submittedAt: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  inputData: {
    productName: string;
    mid: string;
    url: string;
    keywords: string[];
  };
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: number;
    campaignName: string;
    logo?: string;
    status: string;
    serviceType: string;
  };
}

// 편집 셀 타입
export interface EditingCell {
  id: string;
  field: string;
}

// 캠페인 아이템 타입
export interface CampaignItem {
  id: number;
  campaignName: string;
}

// 검색 필터 타입
export interface SearchFilters {
  searchInput: string;
  statusFilter: string;
  searchDateFrom: string;
  searchDateTo: string;
  selectedCampaignId: number | 'all';
}
