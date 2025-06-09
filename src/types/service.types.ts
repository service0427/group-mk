// 서비스 타입 정의
export type ServiceType = 
  | 'NAVER_PLACE'
  | 'NAVER_BLOG'
  | 'NAVER_CAFE'
  | 'NAVER_KIN'
  | 'INSTAGRAM'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'OTHER';

// 서비스 정보 인터페이스
export interface ServiceInfo {
  type: ServiceType;
  name: string;
  description: string;
  icon?: string;
}