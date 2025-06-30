import React from 'react';

// 서비스 카테고리와 서비스 타입 코드 매핑
export const SERVICE_TYPE_MAP = {
  'NS 트래픽': 'NaverShoppingTraffic',   // 기존 ntraffic에서 정확한 타입 코드로 변경
  'NS 순위확인': 'NaverShoppingRank',
  'NS 가구매': 'NaverShoppingFakesale',
  'NP 저장하기': 'NaverPlaceSave',
  'NP 저장': 'NaverPlaceSave',           // 약식 명칭 지원
  'NP 블로그공유': 'NaverPlaceShare',
  'NP 공유': 'NaverPlaceShare',          // 약식 명칭 지원
  'NP 트래픽': 'NaverPlaceTraffic',
  'NP 순위확인': 'NaverPlaceRank',
  'NB 포스팅': 'NaverBlogPost',
  'N 자동완성': 'NaverAuto',
  'N 트래픽': 'NaverTraffic',            // 기존 ntraffic에서 정확한 타입 코드로 변경
  'CP 트래픽': 'CoupangTraffic',
  'C 트래픽': 'CoupangTraffic',          // 약식 명칭 지원
  'CP 가구매': 'CoupangFakesale',
  'OH 트래픽': 'OhouseTraffic'
};

// 서비스 타입 코드와 카테고리 매핑 (역방향)
export const SERVICE_TYPE_TO_CATEGORY: Record<string, string> = {
  // 기존 코드 매핑 (하위 호환성)
  'ntraffic': 'NS/N 트래픽', // 네이버 트래픽 서비스 통합 (구 코드)
  
  // 새 코드 매핑
  'NaverTraffic': 'N 트래픽',
  'NaverShoppingTraffic': 'NS 트래픽',
  'NaverShoppingFakesale': 'NS 가구매',
  'NaverShoppingFakeSale': 'NS 가구매', // DB에서 사용하는 형식 추가
  'NaverShoppingRank': 'NS 순위확인',
  'NaverPlaceSave': 'NP 저장하기',
  'NaverPlaceShare': 'NP 블로그공유',
  'NaverPlaceTraffic': 'NP 트래픽',
  'NaverPlaceRank': 'NP 순위확인',
  'NaverBlogPost': 'NB 포스팅',
  'NaverAuto': 'N 자동완성',
  'CoupangTraffic': 'CP 트래픽',
  'CoupangFakesale': 'CP 가구매',
  'CoupangFakeSale': 'CP 가구매', // DB에서 사용하는 형식 추가
  'OhouseTraffic': 'OH 트래픽',
  
  // URL 매핑 (새 URL 구조 지원)
  'naver-traffic': 'N 트래픽',
  'naver-shopping-traffic': 'NS 트래픽',
  'naver-shopping-rank': 'NS 순위확인',
  'naver-shopping-fakesale': 'NS 가구매',
  'naver-place-save': 'NP 저장하기',
  'naver-place-share': 'NP 블로그공유',
  'naver-place-traffic': 'NP 트래픽',
  'naver-place-rank': 'NP 순위확인',
  'naver-blog-post': 'NB 포스팅',
  'naver-auto': 'N 자동완성',
  'coupang-traffic': 'CP 트래픽',
  'coupang-fakesale': 'CP 가구매',
  'ohouse-traffic': 'OH 트래픽'
};

// URL 서비스 타입을 DB 서비스 타입으로 변환하는 매핑
export const URL_TO_DB_SERVICE_TYPE: Record<string, string> = {
  'naver-traffic': 'NaverTraffic',
  'naver-shopping-traffic': 'NaverShoppingTraffic',
  'naver-shopping-rank': 'NaverShoppingRank',
  'naver-shopping-fakesale': 'NaverShoppingFakeSale',
  'naver-shopping-fake-sale': 'NaverShoppingFakeSale', // ServiceSelector가 생성하는 형식도 지원
  'naver-place-save': 'NaverPlaceSave',
  'naver-place-share': 'NaverPlaceShare',
  'naver-place-traffic': 'NaverPlaceTraffic',
  'naver-place-rank': 'NaverPlaceRank',
  'naver-blog-post': 'NaverBlogPost',
  'naver-auto': 'NaverAuto',
  'coupang-traffic': 'CoupangTraffic',
  'coupang-fakesale': 'CoupangFakeSale',
  'coupang-fake-sale': 'CoupangFakeSale', // ServiceSelector가 생성하는 형식도 지원
  'ohouse-traffic': 'OhouseTraffic'
};

// 상태 옵션
export const STATUS_OPTIONS = [
  {value: 'all', label: '전체'},
  {value: 'submitted', label: '승인요청'},
  {value: 'approved', label: '승인완료'},
  {value: 'rejected', label: '반려'},
  {value: 'pending', label: '대기중'},
  {value: 'active', label: '진행중'},
  {value: 'paused', label: '일시중단'},
  {value: 'pending_user_confirm', label: '거래확인대기'},
  {value: 'completed', label: '완료'},
  {value: 'cancelled', label: '취소'},
  {value: 'refund_pending', label: '환불대기'},
  {value: 'refund_approved', label: '환불승인'},
  {value: 'refunded', label: '환불완료'}
];

// 날짜 포맷팅 함수
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 상태에 따른 배지 스타일 결정 함수
export const getStatusBadge = (status: string): JSX.Element => {
  switch(status) {
    case 'submitted':
      return <span className="badge badge-warning whitespace-nowrap">승인요청</span>;
    case 'approved':
      return <span className="badge badge-success whitespace-nowrap">승인완료</span>;
    case 'rejected':
      return <span className="badge badge-danger whitespace-nowrap">반려</span>;
    case 'draft':
      return <span className="badge badge-light whitespace-nowrap">임시저장</span>;
    case 'active':
      return <span className="badge badge-primary whitespace-nowrap">진행중</span>;
    case 'paused':
      return <span className="badge badge-secondary whitespace-nowrap">일시중단</span>;
    case 'completed':
      return <span className="badge badge-dark whitespace-nowrap">완료</span>;
    case 'pending_user_confirm':
      return <span className="badge badge-info whitespace-nowrap">거래확인대기</span>;
    case 'cancelled':
      return <span className="badge badge-secondary whitespace-nowrap">취소</span>;
    case 'refund':
      return <span className="badge badge-info whitespace-nowrap">환불완료</span>;
    case 'refund_pending':
      return <span className="badge badge-warning whitespace-nowrap">환불대기</span>;
    case 'refund_approved':
      return <span className="badge badge-primary whitespace-nowrap">환불승인</span>;
    default:
      return <span className="badge badge-light whitespace-nowrap">대기중</span>;
  }
};
