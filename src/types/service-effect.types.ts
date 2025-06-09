// 서비스 효과 카테고리 타입
export type ServiceEffectCategory = 
  | 'NAVER_SHOPPING'
  | 'NAVER_PLACE'
  | 'NAVER_BLOG'
  | 'NAVER_CAFE'
  | 'NAVER_KIN'
  | 'COUPANG'
  | 'INSTAGRAM'
  | 'YOUTUBE'
  | 'TIKTOK';

// 카테고리별 이름 매핑
export const SERVICE_CATEGORY_NAMES: Record<ServiceEffectCategory, string> = {
  NAVER_SHOPPING: '네이버 쇼핑',
  NAVER_PLACE: '네이버 플레이스',
  NAVER_BLOG: '네이버 블로그',
  NAVER_CAFE: '네이버 카페',
  NAVER_KIN: '네이버 지식인',
  COUPANG: '쿠팡',
  INSTAGRAM: '인스타그램',
  YOUTUBE: '유튜브',
  TIKTOK: '틱톡'
};