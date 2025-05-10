// 서비스 타입 매핑 정의
export const SERVICE_TYPE_MAP = {
  'NS 트래픽': 'NaverShopTraffic',
  'NP 저장': 'NaverPlaceSave',
  'NP 공유': 'NaverPlaceShare',
  'NP 트래픽': 'NaverPlaceTraffic',
  'N 자동완성': 'NaverAuto',
  'N 트래픽': 'ntraffic',
  'C 트래픽': 'CoupangTraffic',
  'OH 트래픽': 'OhouseTraffic'
};

// 서비스 타입 코드와 카테고리 매핑 (역방향)
export const SERVICE_TYPE_TO_CATEGORY = Object.entries(SERVICE_TYPE_MAP).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);

// 상태 옵션 배열
export const STATUS_OPTIONS = [
  {"code": "", "name": "전체"},
  {"code": "submitted", "name": "검토 대기중"},
  {"code": "approved", "name": "승인됨"},
  {"code": "rejected", "name": "반려됨"},
];

// 날짜 포맷 함수
export const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('ko-KR');
};
