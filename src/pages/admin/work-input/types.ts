export interface SlotWorkInfo {
  id: string; // UUID (자동 생성)
  slot_id: string; // slots.id 참조
  date: string; // 작업한 일자 YYYY-MM-DD
  work_cnt: number; // 작업 횟수
  created_at: string; // 등록일 (자동 생성)
  created_by: string; // 작성자 ID
  notes?: string; // 비고
}

export interface Slot {
  id: string; // 슬롯 UUID
  status: string; // 슬롯 상태
  quantity?: number; // 작업 타수
  start_date?: string; // 작업 시작일
  end_date?: string; // 작업 종료일
  user_id: string; // 사용자 ID
  mat_id: string; // 매트 ID
  user_slot_number?: number; // 매트별 슬롯 번호
  campaign_name?: string; // 캠페인 이름
  campaign_id?: number; // 캠페인 ID
  service_type?: string; // 서비스 타입
  description?: string; // 설명
  
  // 추가 정보 (JOIN으로 가져오는 데이터)
  keywords?: string; // 키워드 정보
  mid?: string; // MID 정보
  url?: string; // URL 정보
  user_email?: string; // 사용자 이메일
  user_name?: string; // 사용자 이름
}

// 작업 입력 폼 데이터 인터페이스
export interface WorkInputFormData {
  slot_id: string;
  date: string;
  work_cnt: number;
  notes?: string;
}

// 필터링 옵션 인터페이스
export interface FilterOptions {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  service_type?: string;
  mat_id?: string;
  campaign_id?: number;
}