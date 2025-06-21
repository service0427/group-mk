// 보장성 슬롯 시스템 타입 정의
// 작성일: 2025-06-15

// 보장성 슬롯 견적 요청 상태
export type GuaranteeSlotRequestStatus = 'requested' | 'negotiating' | 'accepted' | 'rejected' | 'expired' | 'purchased';

// 협상 메시지 타입
export type NegotiationMessageType = 'message' | 'price_proposal' | 'counter_offer' | 'acceptance' | 'renegotiation_request';

// 보장성 슬롯 상태
export type GuaranteeSlotStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';

// 홀딩 상태
export type HoldingStatus = 'holding' | 'partial_released' | 'completed' | 'refunded';

// 거래 타입
export type TransactionType = 'purchase' | 'settlement' | 'refund' | 'cancellation';

// 보장성 슬롯 견적 요청
export interface GuaranteeSlotRequest {
  id: string;
  campaign_id: number;
  user_id: string;
  distributor_id?: string;
  target_rank: number;
  guarantee_count: number;
  initial_budget?: number;
  status: GuaranteeSlotRequestStatus;
  final_daily_amount?: number;
  keyword_id?: number;
  input_data?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  quantity?: number;
  user_reason?: string;
  additional_requirements?: string;
  created_at: string;
  updated_at: string;
}

// 첨부파일 정보
export interface AttachmentFile {
  url: string;
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
}

// 협상 메시지
export interface GuaranteeSlotNegotiation {
  id: string;
  request_id: string;
  sender_id: string;
  sender_type: 'user' | 'distributor';
  message_type: NegotiationMessageType;
  message: string;
  proposed_daily_amount?: number;
  proposed_guarantee_count?: number;
  attachments?: AttachmentFile[];
  is_read: boolean;
  created_at: string;
}

// 보장성 슬롯
export interface GuaranteeSlot {
  id: string;
  request_id?: string;
  user_id: string;
  product_id: number;
  distributor_id: string;
  target_rank: number;
  guarantee_count: number;
  completed_count: number;
  daily_guarantee_amount: number;
  total_amount: number;
  status: GuaranteeSlotStatus;
  keyword_id?: number;
  input_data?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  quantity?: number;
  user_reason?: string;
  additional_requirements?: string;
  purchase_reason?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // 환불 요청 정보
  refund_requests?: Array<{
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    refund_reason: string;
    approval_notes?: string;
    request_date: string;
    approval_date?: string;
    refund_amount?: number;
    approver_id?: string;
  }>;
}

// 홀딩 금액 관리
export interface GuaranteeSlotHolding {
  id: string;
  guarantee_slot_id: string;
  user_id: string;
  total_amount: number;
  user_holding_amount: number;
  distributor_holding_amount: number;
  distributor_released_amount: number;
  status: HoldingStatus;
  created_at: string;
  updated_at: string;
}

// 정산 내역
export interface GuaranteeSlotSettlement {
  id: string;
  guarantee_slot_id: string;
  confirmed_date: string;
  confirmed_by: string;
  target_rank: number;
  achieved_rank: number;
  is_guaranteed: boolean;
  amount: number;
  notes?: string;
  created_at: string;
}

// 거래 내역
export interface GuaranteeSlotTransaction {
  id: string;
  guarantee_slot_id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  description?: string;
  created_at: string;
}

// 보장성 캠페인 확장 타입 (campaigns 테이블과 연동)
export interface GuaranteeCampaign {
  id: number;
  campaign_name: string;
  service_type: string;
  slot_type: 'guarantee';
  is_guarantee: true;
  is_negotiable: boolean;
  guarantee_count?: number;
  target_rank?: number;
  min_guarantee_price?: number;
  max_guarantee_price?: number;
  unit_price: number;
  status: string;
}

// API 요청/응답 타입
export interface CreateGuaranteeSlotRequestParams {
  campaign_id: number;
  target_rank: number;
  guarantee_count: number;
  initial_budget?: number;
  message?: string;
  keyword_id?: number;
  input_data?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  quantity?: number;
  user_reason?: string;
  additional_requirements?: string;
}

export interface CreateNegotiationMessageParams {
  request_id: string;
  message: string;
  proposed_daily_amount?: number;
  proposed_guarantee_count?: number;
  message_type: NegotiationMessageType;
  attachments?: AttachmentFile[];
  isFromDistributorPage?: boolean; // 보장형 슬롯 관리 페이지에서 보낸 것인지
}

export interface PurchaseGuaranteeSlotParams {
  request_id: string;
  purchase_reason?: string;
}

export interface ConfirmRankAchievementParams {
  guarantee_slot_id: string;
  achieved_rank: number;
  notes?: string;
}

// 목록 조회 필터
export interface GuaranteeSlotRequestFilter {
  user_id?: string;
  distributor_id?: string;
  status?: GuaranteeSlotRequestStatus;
  campaign_id?: number;
}

export interface GuaranteeSlotFilter {
  user_id?: string;
  distributor_id?: string;
  status?: GuaranteeSlotStatus;
  product_id?: number;
}

// 통계 타입
export interface GuaranteeSlotStats {
  total_requests: number;
  active_slots: number;
  completed_slots: number;
  total_revenue: number;
  avg_negotiated_price: number;
  success_rate: number;
}