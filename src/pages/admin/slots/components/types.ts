// 슬롯 관련 타입 정의
export interface Campaign {
  id: number;
  mat_id: string;
  campaign_name: string;
  service_type: string;
  status: string;
  description: string;
  logo?: string;
  add_info?: any;
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
  product_id?: number; // 캠페인 ID
  campaign_name?: string; // 캠페인 이름 (UI 표시용)
  campaign_logo?: string; // 캠페인 로고 (UI 표시용)
  status: string;
  created_at: string;
  submitted_at: string | null;
  processed_at?: string;
  input_data: {
    productName?: string;
    mid?: string;
    url?: string;
    keywords?: string[];
    mainKeyword?: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    dueDays?: number | string;
    workCount?: number | string;
    quantity?: number | string;
    타수?: number | string;
    '일일 타수'?: number | string;
    '작업량'?: number | string;
    [key: string]: any; // 추가 필드를 허용
  }; // 캠페인 입력 데이터 (JSON)
  keyword_id?: number; // 키워드 ID 필드 추가
  quantity?: number; // 작업 타수 필드 추가
  deadline?: string; // 마감일 필드 추가
  is_auto_refund_candidate?: boolean; // 자동 환불 대상 여부
  is_auto_continue?: boolean; // 자동 연장 여부
  rejection_reason?: string; // 반려 사유
  mat_reason?: string; // 관리자 메모
  user_reason?: string; // 사용자 메모
  start_date?: string; // 작업 시작일
  end_date?: string; // 작업 종료일
  user?: User; // 사용자 정보 (조인된 데이터)
}

export interface SearchParams {
  searchTerm: string;
  searchStatus: string;
  searchDateFrom: string;
  searchDateTo: string;
  selectedServiceType: string;
  selectedCampaign: string;
}
