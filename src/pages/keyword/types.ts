// 키워드 그룹 타입
export interface KeywordGroup {
  id: number;
  userId: string;
  name: string;
  campaignName: string | null;   // 캠페인 대분류 이름 (네이버, 쿠팡)
  campaignType: string | null;   // 캠페인 중분류 이름 (N트래픽, C쇼핑)
  isDefault: boolean;            // 기본 그룹 여부
  createdAt: string;
  updatedAt: string;
  keywordCount?: number;         // 그룹의 키워드 개수
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

// 트리 구조를 위한 확장된 타입들

// 캠페인 그룹 트리 항목 타입
export interface CampaignTreeItem {
  name: string;
  logo?: string;
  types: {
    name: string;
    code: string;
    groups: KeywordGroup[];
  }[];
}

// 그룹 트리 데이터 타입
export interface KeywordGroupTreeData {
  campaigns: CampaignTreeItem[];
  defaultGroup: KeywordGroup | null;
  generalGroups: KeywordGroup[];
}