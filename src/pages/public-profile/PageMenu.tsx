import { useMenus } from '@/providers';
import { NavbarMenu } from '@/partials/menu/NavbarMenu';
import { useLocation } from 'react-router-dom';
import { TMenuConfig, IMenuItemConfig } from '@/components/menu/types';


// 경로 세그먼트를 분석하여 메뉴 구조에서 해당 경로에 맞는 항목 찾기
const findMenuItemPath = (
  items: IMenuItemConfig[],
  targetPath: string,
  parentPath: IMenuItemConfig[] = []
): IMenuItemConfig[] | null => {
  // URL 경로의 세그먼트 분석
  const segments = targetPath.split('/').filter(segment => segment.length > 0);

  // 특별 경로 처리 - 네이버 플레이스 경로
  if (segments.length >= 4 &&
    segments[0] === 'advertise' &&
    segments[1] === 'naver' &&
    segments[2] === 'place') {

    // NAVER 플레이스 메뉴 항목 찾기
    const naverId = findMenuByTitle(items, 'NAVER 플레이스');
    if (!naverId) return null;

    // 하위 메뉴에서 특정 항목 찾기 (트래픽/위치저장/블로그공유)
    const subType = segments[3]; // traffic, save, share
    let subMenuTitle = '';

    if (subType === 'traffic') {
      subMenuTitle = 'NP 트래픽';
    } else if (subType === 'save') {
      subMenuTitle = 'NP 위치저장';
    } else if (subType === 'share') {
      subMenuTitle = 'NP 블로그공유';
    }

    if (subMenuTitle && naverId.children) {
      const subMenu = findMenuByTitle(naverId.children as IMenuItemConfig[], subMenuTitle);
      if (subMenu) {
        return [naverId, subMenu];
      }
    }

    return [naverId];
  }

  // 특별 경로 처리 - 네이버 쇼핑 경로
  if (segments.length >= 4 &&
    segments[0] === 'advertise' &&
    segments[1] === 'naver' &&
    segments[2] === 'shopping') {

    // NAVER 쇼핑 메뉴 항목 찾기
    const naverId = findMenuByTitle(items, 'NAVER 쇼핑');
    if (!naverId) return null;

    // NS 트래픽 메뉴 찾기
    if (segments[3] === 'traffic' && naverId.children) {
      const subMenu = findMenuByTitle(naverId.children as IMenuItemConfig[], 'NS 트래픽');
      if (subMenu) {
        return [naverId, subMenu];
      }
    }

    return [naverId];
  }

  // 일반적인 경로 처리 - 정확히 일치하는 항목 찾기
  let exactMatch: IMenuItemConfig[] | null = null;
  let bestMatch: IMenuItemConfig[] | null = null;
  let bestMatchLength = 0;

  const findPath = (
    items: IMenuItemConfig[],
    targetPath: string,
    currentPath: IMenuItemConfig[] = []
  ): void => {
    for (const item of items) {
      const newPath = [...currentPath, item];

      // 정확히 일치하는 경우
      if (item.path && item.path === targetPath) {
        exactMatch = newPath;
        return;
      }

      // 부분 일치하는 경우 (가장 긴 매치를 저장)
      if (item.path && targetPath.includes(item.path) && item.path.length > bestMatchLength) {
        bestMatch = newPath;
        bestMatchLength = item.path.length;
      }

      // 하위 메뉴가 있는 경우 재귀 탐색
      if (item.children) {
        findPath(item.children as IMenuItemConfig[], targetPath, newPath);
        if (exactMatch) return; // 정확한 매치를 찾았으면 더 이상 탐색하지 않음
      }
    }
  };

  findPath(items, targetPath, parentPath);

  // 정확한 매치가 있으면 그것을 반환, 없으면 가장 긴 부분 매치 반환
  return exactMatch || bestMatch;
};

// 메뉴 항목에서 특정 제목을 가진 항목 찾기
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

// 현재 경로에 맞는 형제 메뉴 찾기
const findSiblingMenus = (menuPath: IMenuItemConfig[], currentPath: string): TMenuConfig | undefined => {
  if (menuPath.length < 2) return undefined;

  // 현재 URL 경로의 세그먼트 분석
  const segments = currentPath.split('/').filter(segment => segment.length > 0);

  // 네이버 플레이스 경로인 경우 특별 처리 (advertise/naver/place/...)
  if (segments.length >= 3 &&
    segments[0] === 'advertise' &&
    segments[1] === 'naver' &&
    segments[2] === 'place') {
    // 상위 메뉴에서 "NAVER 플레이스"를 찾기
    for (const item of menuPath) {
      if (item.title === 'NAVER 플레이스') {
        return item.children as TMenuConfig;
      }
    }
  }

  // 네이버 쇼핑 경로인 경우 특별 처리 (advertise/naver/shopping/...)
  if (segments.length >= 3 &&
    segments[0] === 'advertise' &&
    segments[1] === 'naver' &&
    segments[2] === 'shopping') {
    // 상위 메뉴에서 "NAVER 쇼핑"을 찾기
    for (const item of menuPath) {
      if (item.title === 'NAVER 쇼핑') {
        return item.children as TMenuConfig;
      }
    }
  }

  // 일반적인 처리 - 부모 메뉴의 children 반환 (형제 메뉴들)
  const parentIndex = menuPath.length > 2 ? menuPath.length - 2 : 0;
  const parentItem = menuPath[parentIndex];
  return parentItem.children as TMenuConfig;
};

interface PageMenuProps {
  fallbackIndex?: number;
}

// URL 경로 패턴에 따라 적절한 fallbackIndex를 결정하는 함수
const determineFallbackIndex = (pathname: string): number => {
  // 경로에 따른 fallbackIndex 매핑
  if (pathname.includes('/advertise/naver')) {
    return 2; // 네이버 광고 관련 메뉴
  } else if (pathname.includes('/advertise/coupang')) {
    return 2; // 쿠팡 광고 관련 메뉴
  } else if (pathname.includes('/advertise/ohouse')) {
    return 2; // 오늘의집 광고 관련 메뉴
  } else if (pathname.includes('/account')) {
    return 3; // 계정 관련 메뉴 (예시)
  } else if (pathname.includes('/network')) {
    return 4; // 네트워크 관련 메뉴 (예시)
  } else {
    return 2; // 기본값
  }
};

const PageMenu = ({ fallbackIndex }: PageMenuProps = {}) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');

  // 외부에서 fallbackIndex가 지정되지 않은 경우, 경로에 따라 동적으로 결정
  const dynamicFallbackIndex = fallbackIndex !== undefined ? fallbackIndex : determineFallbackIndex(pathname);

  // 현재 URL 경로에 따라 적절한 메뉴 항목 찾기
  if (!menuConfig) return <>메뉴 설정을 찾을 수 없습니다.</>;

  // URL 경로 세그먼트 분석
  const segments = pathname.split('/').filter(segment => segment.length > 0);

  // 특정 경로 패턴에 대한 직접 처리
  if (segments.length >= 3 && segments[0] === 'advertise' && segments[1] === 'naver') {
    if (segments[2] === 'place') {
      // NAVER 플레이스 메뉴 항목 찾기
      const naverPlaceMenu = findMenuByTitle(menuConfig as IMenuItemConfig[], 'NAVER 플레이스');
      if (naverPlaceMenu && naverPlaceMenu.children) {
        return <NavbarMenu items={naverPlaceMenu.children as TMenuConfig} />;
      }
    } else if (segments[2] === 'shopping') {
      // NAVER 쇼핑 메뉴 항목 찾기
      const naverShoppingMenu = findMenuByTitle(menuConfig as IMenuItemConfig[], 'NAVER 쇼핑');
      if (naverShoppingMenu && naverShoppingMenu.children) {
        return <NavbarMenu items={naverShoppingMenu.children as TMenuConfig} />;
      }
    } else if (segments[2] === 'auto') {
      // NAVER 자동완성 메뉴 항목 찾기
      const naverAutoMenu = findMenuByTitle(menuConfig as IMenuItemConfig[], 'NAVER 자동완성');
      if (naverAutoMenu && naverAutoMenu.children) {
        return <NavbarMenu items={naverAutoMenu.children as TMenuConfig} />;
      }
    } else if (segments[2] === 'traffic') {
      // NAVER 트래픽 메뉴 항목 찾기
      const naverTrafficMenu = findMenuByTitle(menuConfig as IMenuItemConfig[], 'NAVER 트래픽');
      if (naverTrafficMenu && naverTrafficMenu.children) {
        return <NavbarMenu items={naverTrafficMenu.children as TMenuConfig} />;
      }
    }
  } else if (segments.length >= 2 && segments[0] === 'advertise') {
    if (segments[1] === 'ohouse') {
      // 오늘의집 메뉴 항목 찾기
      const ohouseMenu = findMenuByTitle(menuConfig as IMenuItemConfig[], '오늘의집');
      if (ohouseMenu && ohouseMenu.children) {
        return <NavbarMenu items={ohouseMenu.children as TMenuConfig} />;
      }
    } else if (segments[1] === 'coupang') {
      // COUPANG 쇼핑 메뉴 항목 찾기
      const coupangMenu = findMenuByTitle(menuConfig as IMenuItemConfig[], 'COUPANG 쇼핑');
      if (coupangMenu && coupangMenu.children) {
        return <NavbarMenu items={coupangMenu.children as TMenuConfig} />;
      }
    }
  }

  // 일반적인 경로 처리
  const menuPath = findMenuItemPath(menuConfig as IMenuItemConfig[], pathname);
  const siblingMenus = menuPath ? findSiblingMenus(menuPath, pathname) : undefined;
  const fallbackMenuConfig = menuConfig?.[dynamicFallbackIndex]?.children;

  if (siblingMenus) {
    return <NavbarMenu items={siblingMenus} />;
  } else if (fallbackMenuConfig) {
    return <NavbarMenu items={fallbackMenuConfig} />;
  } else {
    return <>적절한 메뉴를 찾을 수 없습니다.</>;
  }
};

export { PageMenu };
