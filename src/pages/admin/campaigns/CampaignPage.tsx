import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CampaignTemplate } from './components';

/**
 * 공통 캠페인 관리 페이지
 * URL 경로 또는 쿼리 파라미터로 서비스 타입을 전달받아 해당 타입의 캠페인을 표시
 * 
 * 사용 예시:
 * - /admin/campaigns/ntraffic - 경로 파라미터로 N 트래픽 캠페인 표시
 * - /admin/campaigns?service_type=ntraffic - 쿼리 파라미터로 N 트래픽 캠페인 표시
 * 
 * @returns 캠페인 관리 페이지 컴포넌트
 */
const CampaignPage: React.FC = () => {
  // URL 파라미터 가져오기
  const { serviceType: pathServiceType } = useParams<{ serviceType?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryServiceType = queryParams.get('service_type');

  // 서비스 타입 결정 (경로 파라미터 > 쿼리 파라미터 > 기본값)
  const rawServiceType = pathServiceType || queryServiceType || 'ntraffic';

  // 서비스 타입 정규화 (URL에서 가져온 값을 내부 표현형으로 변환)
  const normalizeServiceType = (type: string): string => {
    // 소문자 변환 및 앞뒤 공백 제거
    const normalized = type.toLowerCase().trim();
    
    // 'all' 타입은 그대로 반환
    if (normalized === 'all') {
      return 'all';
    }

    // 매핑 테이블
    const serviceTypeMap: Record<string, string> = {
      // N 트래픽 관련
      'ntraffic': 'ntraffic',
      'navertraffic': 'ntraffic',
      'naver-traffic': 'ntraffic',

      // N 자동완성 관련
      'nauto': 'nauto',
      'naver-auto': 'nauto',

      // N 쇼핑 관련
      'nshopping': 'nshopping',
      'navershopping': 'nshopping',
      'naver-shopping': 'nshopping',
      'naver-shopping-traffic': 'nshopping',

      // N 가구매 관련
      'nfakesale': 'nfakesale',
      'naverfakesale': 'nfakesale',
      'naver-fakesale': 'nfakesale',
      'naver-shopping-fakesale': 'nfakesale',

      // N 블로그 관련
      'nblog': 'nblog',
      'naver-blog': 'nblog',

      // N 카페 관련
      'ncafe': 'ncafe',
      'naver-cafe': 'ncafe',

      // N 플레이스 관련
      'nplace': 'nplace',
      'naverplace': 'nplace',
      'naver-place': 'nplace',
      'naver-place-traffic': 'nplace-traffic', // 수정: 별도 항목으로 구분

      // N 플레이스 저장 관련
      'nplacesave': 'nplace-save',
      'nplace-save': 'nplace-save',
      'naver-place-save': 'nplace-save',

      // N 플레이스 공유 관련
      'nplaceshare': 'nplace-share',
      'nplace-share': 'nplace-share',
      'naver-place-share': 'nplace-share',
      
      // 네이버 쇼핑 순위확인
      'naver-shopping-rank': 'naver-shopping-rank',
      'nshopping-rank': 'naver-shopping-rank',
      'nshop-rank': 'naver-shopping-rank',
      
      // 네이버 플레이스 순위확인
      'naver-place-rank': 'naver-place-rank',
      'nplace-rank': 'naver-place-rank',

      // 쿠팡 관련
      'coupang': 'coupangtraffic', // 소문자로 통일
      'coupangtraffic': 'coupangtraffic',
      'coupang-traffic': 'coupangtraffic',
      
      // 전체 캠페인
      'all': 'all',

    };

    // 맵핑된 값이 있으면 사용, 없으면 원래 값 그대로 사용
    return serviceTypeMap[normalized] || normalized;
  };

  // 정규화된 서비스 타입
  const serviceType = normalizeServiceType(rawServiceType);

  // 서비스 타입에 따른 제목 결정
  const getTitleFromServiceType = (type: string): string => {
    // 대소문자 구분 없이 처리
    const normalizedType = type.toLowerCase();

    // 서비스 타입별 제목 매핑
    const titleMap: Record<string, string> = {
      // 네이버 트래픽
      'ntraffic': 'N 트래픽 캠페인 관리',
      'naver-traffic': 'N 트래픽 캠페인 관리',
      'navertraffic': 'N 트래픽 캠페인 관리',

      // 네이버 자동완성
      'nauto': 'N 자동완성 캠페인 관리',
      'naver-auto': 'N 자동완성 캠페인 관리',

      // 네이버 블로그
      'nblog': 'N 블로그 캠페인 관리',
      'naver-blog': 'N 블로그 캠페인 관리',

      // 네이버 쇼핑
      'nshopping': 'N 쇼핑 트래픽 캠페인 관리',
      'navershopping': 'N 쇼핑 트래픽 캠페인 관리',
      'naver-shopping': 'N 쇼핑 트래픽 캠페인 관리',
      'naver-shopping-traffic': 'N 쇼핑 트래픽 캠페인 관리',

      // 네이버 쇼핑 가구매
      'nfakesale': 'NS 가구매 캠페인 관리',
      'naverfakesale': 'NS 가구매 캠페인 관리',
      'naver-fakesale': 'NS 가구매 캠페인 관리',
      'naver-shopping-fakesale': 'NS 가구매 캠페인 관리',
      
      // 네이버 쇼핑 순위확인
      'naver-shopping-rank': 'NS 순위확인 캠페인 관리',
      'nshopping-rank': 'NS 순위확인 캠페인 관리',
      'nshop-rank': 'NS 순위확인 캠페인 관리',

      // 네이버 플레이스
      'nplace': 'N 플레이스 캠페인 관리',
      'naverplace': 'N 플레이스 캠페인 관리',
      'naver-place': 'N 플레이스 캠페인 관리',
      'nplace-traffic': 'N 플레이스 트래픽 캠페인 관리',
      'naver-place-traffic': 'N 플레이스 트래픽 캠페인 관리',

      // 네이버 플레이스 저장
      'nplacesave': 'N 플레이스 저장하기 캠페인 관리',
      'nplace-save': 'N 플레이스 저장하기 캠페인 관리',
      'naver-place-save': 'N 플레이스 저장하기 캠페인 관리',

      // 네이버 플레이스 공유
      'nplaceshare': 'N 플레이스 블로그공유 캠페인 관리',
      'nplace-share': 'N 플레이스 블로그공유 캠페인 관리',
      'naver-place-share': 'N 플레이스 블로그공유 캠페인 관리',
      
      // 네이버 플레이스 순위확인
      'naver-place-rank': 'NP 순위확인 캠페인 관리',
      'nplace-rank': 'NP 순위확인 캠페인 관리',

      // 네이버 카페
      'ncafe': 'N 카페 캠페인 관리',
      'naver-cafe': 'N 카페 캠페인 관리',

      // 쿠팡
      'coupangtraffic': '쿠팡 트래픽 캠페인 관리',
      'coupang': '쿠팡 트래픽 캠페인 관리',
      'coupang-traffic': '쿠팡 트래픽 캠페인 관리',
      
      // 전체 캠페인
      'all': '모든 캠페인 통합 관리',
    };

    // 매핑된 제목이 있으면 반환, 없으면 기본 제목 반환
    return titleMap[normalizedType] || `${type} 캠페인 관리`;
  };

  // 서비스 타입에 따른 설명 생성
  const getDescriptionFromServiceType = (type: string): string => {
    return `관리자 메뉴 > 캠페인 관리 > ${getTitleFromServiceType(type)}`;
  };

  // 서비스 타입에 따른 제목과 설명 결정
  const title = getTitleFromServiceType(serviceType);
  const description = getDescriptionFromServiceType(serviceType);

  return (
    <CampaignTemplate
      title={title}
      description={description}
      serviceCode={serviceType}
    />
  );
};

export { CampaignPage };