// 환불 설정 타입 정의
export interface RefundSettings {
  enabled: boolean;
  type: 'immediate' | 'delayed' | 'cutoff_based';
  delay_days?: number; // type이 delayed일 때 사용
  cutoff_time?: string; // HH:mm 형식 (예: "22:00")
  requires_approval: boolean;
  approval_roles?: string[]; // 승인 필요한 역할들
  refund_rules: {
    min_usage_days: number; // 최소 사용 일수
    max_refund_days: number; // 환불 가능 최대 일수
    partial_refund: boolean; // 부분 환불 가능 여부
  };
}

// 환불 승인 요청 타입
export interface SlotRefundApproval {
  id: string;
  slot_id: string;
  requester_id: string;
  approver_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  request_date: string;
  approval_date?: string;
  refund_amount: number;
  refund_reason?: string;
  approval_notes?: string;
  // 관계 데이터
  slot?: {
    id: string;
    product_id: number;
    user_id: string;
    start_date?: string;
    end_date?: string;
    input_data?: any;
  };
  requester?: {
    id: string;
    full_name: string;
    email: string;
  };
  approver?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// 환불 계산 결과 타입
export interface RefundCalculation {
  isRefundable: boolean;
  refundAmount: number;
  originalAmount: number;
  usedDays: number;
  remainingDays: number;
  refundRate?: number; // deprecated - 실제 환불 금액은 상황에 따라 결정
  message?: string;
  requiresApproval: boolean;
  expectedRefundDate?: string; // 지연 환불의 경우
}

// 환불 요청 입력 타입
export interface RefundRequest {
  slot_id: string;
  refund_reason: string;
  requested_amount?: number; // 부분 환불 요청 시
}

// 기본 환불 설정
export const DEFAULT_REFUND_SETTINGS: RefundSettings = {
  enabled: true,
  type: 'immediate',
  delay_days: 0,
  cutoff_time: '00:00',
  requires_approval: false,
  approval_roles: ['distributor', 'advertiser'],
  refund_rules: {
    min_usage_days: 0,
    max_refund_days: 7,
    partial_refund: true
  }
};