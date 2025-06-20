// 1:1 문의 시스템 타입 정의
// 작성일: 2025-01-20

// 문의 상태
export type InquiryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// 우선순위
export type InquiryPriority = 'low' | 'normal' | 'high' | 'urgent';

// 발신자 역할
export type InquirySenderRole = 'user' | 'distributor' | 'admin';

// 첨부파일 정보
export interface InquiryAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
  uploaded_at?: string;
}

// 1:1 문의
export interface Inquiry {
  id: string;
  slot_id?: string;
  campaign_id?: number;
  user_id: string;
  distributor_id?: string;
  title: string;
  status: InquiryStatus;
  category?: string;
  priority: InquiryPriority;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  users?: {
    id: string;
    email: string;
    full_name: string;
  };
  distributors?: {
    id: string;
    email: string;
    full_name: string;
  };
  slots?: {
    id: string;
    slot_name: string;
    status: string;
  };
  campaigns?: {
    id: number;
    campaign_name: string;
    service_type: string;
  };
  slot_info?: {
    service_type?: string;
    campaign_name?: string;
    campaign_logo?: string;
    start_date?: string;
    end_date?: string;
    target_rank?: number;
    guarantee_count?: number;
    initial_budget?: number;
    final_daily_amount?: number;
    input_data?: Record<string, any>;
    keywords?: {
      id: number;
      main_keyword: string;
      keyword1?: string;
      keyword2?: string;
      keyword3?: string;
      url?: string;
      mid?: string;
    };
    // 결제 정보
    total_amount?: number;
    daily_guarantee_amount?: number;
    purchase_reason?: string;
    user_holding_amount?: number;
    distributor_holding_amount?: number;
    distributor_released_amount?: number;
    holding_status?: string;
    payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled';
  };
}

// 문의 메시지
export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  sender_role: InquirySenderRole;
  message: string; // DB 스키마에 맞춰 message로 통일
  attachments?: InquiryAttachment[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  // 조인된 데이터
  sender?: {
    id: string;
    email: string;
    full_name: string;
  };
  sender_name?: string;
  senderName?: string; // 하위 호환성
  senderEmail?: string;
}

// 문의 카테고리
export interface InquiryCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// API 요청/응답 타입
export interface CreateInquiryParams {
  slot_id?: string;
  guarantee_slot_id?: string;
  campaign_id?: number;
  distributor_id?: string;
  title: string;
  category?: string;
  priority?: InquiryPriority;
  status?: InquiryStatus;
}

export interface CreateInquiryMessageParams {
  inquiry_id: string;
  content: string;
  sender_role: InquirySenderRole;
  attachments?: InquiryAttachment[];
}

export interface UpdateInquiryStatusParams {
  inquiry_id: string;
  status: InquiryStatus;
  resolved_by?: string;
}

// 목록 조회 필터
export interface InquiryFilter {
  user_id?: string;
  distributor_id?: string;
  status?: InquiryStatus;
  category?: string;
  priority?: InquiryPriority;
  slot_id?: string;
  campaign_id?: number;
}

// 통계 타입
export interface InquiryStats {
  total_inquiries: number;
  open_inquiries: number;
  in_progress_inquiries: number;
  resolved_inquiries: number;
  avg_resolution_time: number;
  by_category: Record<string, number>;
  by_priority: Record<InquiryPriority, number>;
}