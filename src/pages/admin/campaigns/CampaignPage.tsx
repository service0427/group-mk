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

    // 매핑 테이블
    const serviceTypeMap: Record<string, string> = {
      // N 트래픽 관련
      'ntraffic': 'ntraffic',
      'navertraffic': 'ntraffic',
      'naver-traffic': 'ntraffic',

      // N 자동완성 관련
      'nauto': 'nfakesale',
      'naver-auto': 'nfakesale',

      // N 쇼핑 관련
      'nshopping': 'nshopping',
      'navershopping': 'nshopping',
      'naver-shopping': 'nshopping',

      // N 가구매 관련
      'nfakesale': 'nfakesale',
      'naverfakesale': 'nfakesale',
      'naver-fakesale': 'nfakesale',

      // N 플레이스 관련
      'nplace': 'nplace',
      'naverplace': 'nplace',
      'naver-place': 'nplace',
      'naver-place-traffic': 'nplace',

      // N 플레이스 저장 관련
      'nplacesave': 'nplace-save',
      'naver-place-save': 'nplace-save',

      // N 플레이스 공유 관련
      'nplaceshare': 'nplace-share',
      'naver-place-share': 'nplace-share',

      // 쿠팡 관련
      'coupang': 'CoupangTraffic',
      'coupangtraffic': 'CoupangTraffic',
      'coupang-traffic': 'CoupangTraffic',

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
      'ntraffic': 'N 트래픽 캠페인 관리',
      'naver-traffic': 'N 트래픽 캠페인 관리',
      'navertraffic': 'N 트래픽 캠페인 관리',
      'nfakesale': 'N 자동완성 캠페인 관리',
      'naver-fakesale': 'N 자동완성 캠페인 관리',
      'naver-auto': 'N 자동완성 캠페인 관리',
      'nblog': 'N 블로그 캠페인 관리',
      'naver-blog': 'N 블로그 캠페인 관리',
      'nweb': 'N 웹 캠페인 관리',
      'naver-web': 'N 웹 캠페인 관리',
      'nplace': 'N 플레이스 캠페인 관리',
      'naver-place': 'N 플레이스 캠페인 관리',
      'naver-place-traffic': 'N 플레이스 트래픽 캠페인 관리',
      'naver-place-save': 'N 플레이스 저장 캠페인 관리',
      'naver-place-share': 'N 플레이스 공유 캠페인 관리',
      'ncafe': 'N 카페 캠페인 관리',
      'naver-cafe': 'N 카페 캠페인 관리',
      'coupangtraffic': '쿠팡 트래픽 캠페인 관리',
      'coupang': '쿠팡 트래픽 캠페인 관리',
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