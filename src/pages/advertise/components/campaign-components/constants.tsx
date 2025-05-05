import React from 'react';

// 서비스 카테고리와 서비스 타입 코드 매핑
export const SERVICE_TYPE_MAP = {
  'NS 트래픽': 'NaverShopTraffic',
  'NP 저장': 'NaverPlaceSave',
  'NP 공유': 'NaverPlaceShare',
  'NP 트래픽': 'NaverPlaceTraffic',
  'N 자동완성': 'NaverAuto',
  'N 트래픽': 'NaverTraffic',
  'C 트래픽': 'CoupangTraffic',
  'OH 트래픽': 'OhouseTraffic'
};

// 서비스 타입 코드와 카테고리 매핑 (역방향)
export const SERVICE_TYPE_TO_CATEGORY = {
  'NaverShopTraffic': 'NS 트래픽',
  'NaverPlaceSave': 'NP 저장',
  'NaverPlaceShare': 'NP 공유',
  'NaverPlaceTraffic': 'NP 트래픽',
  'NaverAuto': 'N 자동완성',
  'NaverTraffic': 'N 트래픽',
  'CoupangTraffic': 'C 트래픽',
  'OhouseTraffic': 'OH 트래픽'
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
  {value: 'completed', label: '완료'}
];

// 날짜 포맷팅 함수
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 상태에 따른 배지 스타일 결정 함수
export const getStatusBadge = (status: string): JSX.Element => {
  switch(status) {
    case 'submitted':
      return <span className="badge badge-warning">승인요청</span>;
    case 'approved':
      return <span className="badge badge-success">승인완료</span>;
    case 'rejected':
      return <span className="badge badge-danger">반려</span>;
    case 'draft':
      return <span className="badge badge-light">임시저장</span>;
    case 'active':
      return <span className="badge badge-primary">진행중</span>;
    case 'paused':
      return <span className="badge badge-secondary">일시중단</span>;
    case 'completed':
      return <span className="badge badge-dark">완료</span>;
    default:
      return <span className="badge badge-light">대기중</span>;
  }
};
