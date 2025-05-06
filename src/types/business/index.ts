// 사업자 등록 관련 타입 정의

// 사업자 정보 타입
export interface BusinessInfo {
  business_number: string;  // 사업자 등록번호
  business_name: string;    // 상호명
  representative_name: string; // 대표자명
}

// users 테이블의 business 필드 타입
export interface UserBusiness extends BusinessInfo {
  verified: boolean; // 인증 여부
  verification_date?: string; // 인증 날짜
}

// 등업 신청 상태
export type LevelupStatus = 'pending' | 'approved' | 'rejected';

// 등업 신청 타입
export interface LevelupApply {
  id: number;
  user_id: string;
  status: LevelupStatus;
  approval_id?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

// 등업 신청 폼 입력 데이터
export interface BusinessFormData {
  business_number: string;
  business_name: string;
  representative_name: string;
}
