export interface Campaign {
  id: number;
  campaignName: string;
  logo?: string;
  status: string;
  serviceType: string;
  refund_settings?: any;
  distributor_id?: string;
  ranking_field_mapping?: {
    keyword_field?: string;
    product_id_field?: string;
    title_field?: string;
    link_field?: string;
    rank_field?: string;
    keyword?: string;  // 새로운 필드 추가
    product_id?: string;  // 새로운 필드 추가
  };
  userInputFields?: Array<{
    fieldName: string;
    description?: string;
    fieldType?: string;
    isRequired?: boolean;
  }>;
  add_info?: {
    add_field?: Array<{
      fieldName: string;
      description?: string;
      fieldType?: string;
      isRequired?: boolean;
    }>;
    [key: string]: any;
  };
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
  campaign_name?: string; // 캠페인 이름 직접 참조용
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
  // 작업 진행률 관련 필드
  quantity?: number; // 일일 작업량
  workProgress?: {
    totalWorkedQuantity: number; // 완료된 작업 수
    totalRequestedQuantity: number; // 요청된 총 작업 수
    completionRate: number; // 완료율 (%)
    workedDays: number; // 작업한 일수
    requestedDays: number; // 요청된 작업 일수
  };
}

export interface CampaignListItem {
  id: number;
  campaignName: string;
  status?: string;
}
