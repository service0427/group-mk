// 키워드 그룹 타입
export interface KeywordGroup {
  id: number;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 키워드 타입
export interface Keyword {
  id: number;
  groupId: number;
  mainKeyword: string;
  mid?: number;
  url?: string;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 키워드 생성/수정을 위한 입력 타입
export interface KeywordInput {
  mainKeyword: string;
  mid?: number;
  url?: string;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  description?: string;
  isActive?: boolean;
}

// 그룹과 키워드 함께 요청하는 응답 타입
export interface KeywordGroupWithKeywords extends KeywordGroup {
  keywords: Keyword[];
}

// 키워드 서비스 응답 타입
export interface KeywordResponse {
  success: boolean;
  data?: any;
  message?: string;
}

// 키워드 필터 타입
export interface KeywordFilter {
  search?: string;
  groupId?: number;
  isActive?: boolean;
}

// 페이지네이션 타입
export interface PaginationParams {
  page: number;
  limit: number;
}

// 정렬 타입
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// 키워드 구매 관련 타입
export interface KeywordPurchaseInput {
  keywordIds: number[];
  amount: number; // 키워드당 금액
}

// 슬롯 상태 타입
export enum SlotStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// 슬롯 타입
export interface Slot {
  id: string;
  matId: string;
  productId: number;
  userId: string;
  status: SlotStatus;
  submittedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  inputData?: any;
  deadline?: string;
  isAutoRefundCandidate: boolean;
  isAutoContinue: boolean;
  createdAt: string;
  updatedAt: string;
  userReason?: string;
  matReason?: string;
  keywordId?: number;
  quantity?: number;
}