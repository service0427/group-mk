export interface Campaign {
  id: number;
  campaignName: string;
  logo?: string;
  status: string;
  serviceType: string;
  refund_settings?: any;
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
  keyword_id?: number; // 키워드 ID (0은 직접입력)
  inputData: {
    productName: string;
    mid: string;
    url: string;
    keywords?: string[];
    mainKeyword?: string;
    keyword1?: string;
    keyword2?: string;
    keyword3?: string;
    work_memo?: string;
    work_memo_date?: string;
    is_manual_input?: boolean;
    minimum_purchase?: number;
    work_days?: number;
    [key: string]: any; // 추가 필드 허용
  };
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  endDate: string | null;
  campaign?: Campaign;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
  refund_requests?: Array<{
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    refund_reason: string;
    approval_notes?: string;
    request_date: string;
    approval_date?: string;
  }>;
}

export interface CampaignListItem {
  id: number;
  campaignName: string;
  status?: string;
}
