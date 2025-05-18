// 사업자 등록 관련 타입 정의

// 출금 계좌 정보 타입
export interface BankAccountInfo {
  bank_name: string;         // 은행명
  account_number: string;    // 계좌번호
  account_holder: string;    // 예금주
  is_editable: boolean;      // 수정 가능 여부 (초기에만 수정 가능)
}

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
  business_email?: string; // 사업자 이메일
  business_image_url?: string; // 사업자 등록증 이미지 URL
  business_image_storage_type?: 'base64' | 'supabase_storage'; // 이미지 저장 타입
  business_image_bucket?: string; // 이미지 버킷 이름 (Supabase Storage 사용 시)
  bank_account?: BankAccountInfo; // 출금 계좌 정보
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
  current_role?: string;  // 현재 사용자 역할
  target_role?: string;   // 신청 대상 역할
  db_role?: string;       // 데이터베이스 역할 정보
}

// 등업 신청 폼 입력 데이터
export interface BusinessFormData {
  business_number: string;
  business_name: string;
  representative_name: string;
  business_email?: string;
  business_image_url?: string;
  bank_account?: BankAccountInfo; // 출금 계좌 정보 추가
}
