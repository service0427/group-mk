// CampaignServiceType을 사용하므로 SERVICE_TYPE_MAP과 SERVICE_TYPE_TO_CATEGORY는 삭제됨
// campaign-modals/types.ts의 CampaignServiceType enum과 SERVICE_TYPE_LABELS를 사용하세요

// 상태 옵션 배열
export const STATUS_OPTIONS = [
  {"code": "", "name": "전체"},
  {"code": "pending", "name": "대기중"},
  {"code": "approved", "name": "승인됨"},
  {"code": "rejected", "name": "반려됨"},
];

// 날짜 포맷 함수
export const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('ko-KR');
};
