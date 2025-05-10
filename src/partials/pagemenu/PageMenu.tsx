import { useMenus } from '@/providers';
import { NavbarMenu } from '@/partials/menu/NavbarMenu';
import { useLocation } from 'react-router-dom';
import { TMenuConfig, IMenuItemConfig } from '@/components/menu/types';

// 메뉴 아이템에서 특정 제목을 가진 아이템 찾기
const findMenuByTitle = (items: IMenuItemConfig[], title: string): IMenuItemConfig | null => {
  for (const item of items) {
    if (item.title === title) {
      return item;
    }

    if (item.children) {
      const found = findMenuByTitle(item.children as IMenuItemConfig[], title);
      if (found) return found;
    }
  }

  return null;
};

// URL에서 서비스 유형 식별 (NP 트래픽, NS 트래픽 등)
const getServiceTypeFromUrl = (pathname: string): string | null => {
  const segments = pathname.split('/').filter(segment => segment.length > 0);
  
  // 관리자 캠페인 경로 처리: /admin/campaigns/...
  if (segments.length >= 3 && segments[0] === 'admin' && segments[1] === 'campaigns') {
    const campaignType = segments[2];
    
    if (campaignType === 'ntraffic') return 'N 트래픽';
    if (campaignType === 'naver-auto') return 'N 자동완성';
    if (campaignType === 'naver-shopping') return 'NS 트래픽';
    if (campaignType === 'naver-place-traffic') return 'NP 트래픽';
    if (campaignType === 'naver-place-save') return 'NP 저장하기';
    if (campaignType === 'naver-place-share') return 'NP 블로그공유';
    if (campaignType === 'coupang') return 'CP 트래픽';
    if (campaignType === 'ohouse') return 'OH 트래픽';
  }
  
  // 기존 advertise 경로 처리
  if (segments.length < 3 || segments[0] !== 'advertise') {
    return null;
  }
  
  const platform = segments[1];
  
  // 2단계 경로 - /advertise/platform/type/...
  if (segments.length >= 4 && !['place', 'shopping'].includes(segments[2])) {
    if (platform === 'naver') {
      if (segments[2] === 'ntraffic') return 'N 트래픽';
      if (segments[2] === 'auto') return 'N 자동완성';
    } else if (platform === 'coupang') {
      if (segments[2] === 'traffic') return 'CP 트래픽';
    } else if (platform === 'ohouse') {
      if (segments[2] === 'traffic') return 'OH 트래픽';
    }
  }
  
  // 3단계 경로 - /advertise/platform/subservice/type/...
  if (segments.length >= 5) {
    if (platform === 'naver') {
      if (segments[2] === 'shopping' && segments[3] === 'traffic') return 'NS 트래픽';
      if (segments[2] === 'place') {
        if (segments[3] === 'traffic') return 'NP 트래픽';
        if (segments[3] === 'save') return 'NP 저장하기';
        if (segments[3] === 'share') return 'NP 블로그공유';
      }
    }
  }
  
  return null;
};

// URL 경로 유형(desc/campaign) 식별
const getPageTypeFromUrl = (pathname: string): 'desc' | 'campaign' | null => {
  const segments = pathname.split('/').filter(segment => segment.length > 0);
  const lastSegment = segments[segments.length - 1];
  
  if (lastSegment === 'desc' || lastSegment === 'campaign') {
    return lastSegment as 'desc' | 'campaign';
  }
  
  // 관리자 캠페인 페이지는 항상 캠페인 형태로 처리
  if (segments.length >= 3 && segments[0] === 'admin' && segments[1] === 'campaigns') {
    return 'campaign';
  }
  
  return null;
};

// 현재 페이지 유형(desc/campaign)에 따라 모든 메뉴가 같은 유형을 가리키도록 설정
const createServiceMenuItems = (currentPageType: 'desc' | 'campaign' = 'desc'): TMenuConfig => {
  return [
    { title: 'N 트래픽', path: `/advertise/ntraffic/${currentPageType}` },
    { title: 'N 자동완성', path: `/advertise/naver/auto/${currentPageType}` },
    { title: 'NS 트래픽', path: `/advertise/naver/shopping/traffic/${currentPageType}` },
    { title: 'NP 트래픽', path: `/advertise/naver/place/traffic/${currentPageType}` },
    { title: 'NP 저장하기', path: `/advertise/naver/place/save/${currentPageType}` },
    { title: 'NP 블로그공유', path: `/advertise/naver/place/share/${currentPageType}` },
    { title: 'CP 트래픽', path: `/advertise/coupang/traffic/${currentPageType}` },
    { title: 'OH 트래픽', path: `/advertise/ohouse/traffic/${currentPageType}` }
  ];
};

// 관리자 캠페인 메뉴 아이템 생성
const createAdminCampaignMenuItems = (): TMenuConfig => {
  return [
    { title: 'N 트래픽', path: '/admin/campaigns/ntraffic' },
    { title: 'N 자동완성', path: '/admin/campaigns/naver-auto' },
    { title: 'NS 트래픽', path: '/admin/campaigns/naver-shopping' },
    { title: 'NP 트래픽', path: '/admin/campaigns/naver-place-traffic' },
    { title: 'NP 저장하기', path: '/admin/campaigns/naver-place-save' },
    { title: 'NP 블로그공유', path: '/admin/campaigns/naver-place-share' },
    { title: 'CP 트래픽', path: '/admin/campaigns/coupang' },
    { title: 'OH 트래픽', path: '/admin/campaigns/ohouse' }
  ];
};

interface PageMenuProps {
  fallbackIndex?: number;
}

const PageMenu = ({ fallbackIndex }: PageMenuProps = {}) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  
  // 메뉴 구성이 없으면 오류 메시지 표시
  if (!menuConfig) {
    return <>메뉴 설정을 찾을 수 없습니다.</>;
  }
  
  // URL 세그먼트 분석
  const segments = pathname.split('/').filter(segment => segment.length > 0);
  
  // 현재 페이지 유형 확인 (desc 또는 campaign)
  const pageType = getPageTypeFromUrl(pathname) || 'desc';
  
  // 관리자 캠페인 페이지 처리
  if (segments.length >= 3 && segments[0] === 'admin' && segments[1] === 'campaigns') {
    const adminCampaignMenuItems = createAdminCampaignMenuItems();
    
    if (adminCampaignMenuItems && adminCampaignMenuItems.length > 0) {
      return <NavbarMenu items={adminCampaignMenuItems} />;
    }
  }
  
  // /advertise 경로에 대한 특별 처리
  if (segments.length >= 2 && segments[0] === 'advertise') {
    // 현재 페이지 유형에 맞는 상단 서비스 메뉴 생성
    const serviceMenuItems = createServiceMenuItems(pageType);
    
    // 메뉴 항목이 있으면 표시
    if (serviceMenuItems && serviceMenuItems.length > 0) {
      return <NavbarMenu items={serviceMenuItems} />;
    }
  }
  
  // 새로운 메뉴 구조에 맞는 처리
  const serviceType = getServiceTypeFromUrl(pathname);
  
  if (serviceType) {
    // 새 메뉴 구조에 맞게 '캠페인 소개' 또는 '캠페인 관리' 찾기
    const menuTitle = pageType === 'desc' ? '캠페인 소개' : '캠페인 관리';
    const menuItem = findMenuByTitle(menuConfig as IMenuItemConfig[], menuTitle);
    
    if (menuItem && menuItem.children) {
      return <NavbarMenu items={menuItem.children as TMenuConfig} />;
    }
  }
  
  // 일반적인 경로나 fallback 처리
  if (fallbackIndex !== undefined && menuConfig[fallbackIndex]?.children) {
    return <NavbarMenu items={menuConfig[fallbackIndex].children as TMenuConfig} />;
  }
  
  // 적절한 메뉴를 찾지 못한 경우
  return <>적절한 메뉴를 찾을 수 없습니다.</>;
};

export { PageMenu };