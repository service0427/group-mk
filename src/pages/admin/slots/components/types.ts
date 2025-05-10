// 슬롯 관련 타입 정의
export interface Campaign {
  id: number;
  mat_id: string;
  campaign_name: string;
  service_type: string;
  status: string;
  description: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
}

export interface Slot {
  id: string;
  mat_id: string;
  user_id: string;
  product_id?: number; // 캠페인 ID 추가
  campaign_name?: string; // 캠페인 이름 추가
  status: string;
  created_at: string;
  submitted_at: string | null;
  processed_at?: string;
  input_data: any;
  rejection_reason?: string;
  mat_reason?: string; // 관리자 메모 정보를 저장할 필드 추가
  user_reason?: string; // 사용자 메모 정보를 저장할 필드 추가
  user?: User; // 사용자 정보를 저장할 필드 추가
}

export interface SearchParams {
  searchTerm: string;
  searchStatus: string;
  searchDateFrom: string;
  searchDateTo: string;
  selectedServiceType: string;
  selectedCampaign: string;
}
