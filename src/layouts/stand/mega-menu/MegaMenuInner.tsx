import { Fragment, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks';
import { KeenIcon } from '@/components';
import { TMenuConfig, IMenuItemConfig, MenuItem, MenuLink, MenuTitle, MenuArrow, Menu, MenuSub } from '@/components/menu';
import {
  MegaMenuSubAccount,
  MegaMenuSubNetwork,
  MegaMenuSubAuth,
  MegaMenuSubHelp,
  MegaMenuSubService,
  MegaMenuSubMyInfo,
  MegaMenuSubAdmin
} from '@/partials/menu/mega-menu';
import { useStandLayout } from '../StandLayoutProvider';
import { MENU_SIDEBAR } from '@/config';
import { useLanguage } from '@/i18n';
import { useAuthContext } from '@/auth';
import { hasPermission, USER_ROLES, PERMISSION_GROUPS } from '@/config/roles.config';

const MegaMenuInner = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { isRTL } = useLanguage();
  const [disabled, setDisabled] = useState(true); // Initially set disabled to true
  const { layout, setMegaMenuEnabled } = useStandLayout();
  const { userRole } = useAuthContext(); // 사용자 역할 가져오기

  // 사이드바의 collapsed 상태만 감지하여 메가메뉴 활성화
  useEffect(() => {
    setDisabled(true);

    const timer = setTimeout(() => {
      setDisabled(false);
    }, 1000); // 1000 milliseconds

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [layout.options.sidebar.collapse]); // sidebarMouseLeave 의존성 제거

  // megaMenu 비활성화 - burger-menu-2 아이콘 제거
  // useEffect(() => {
  //   setMegaMenuEnabled(true);
  // });

  // 사용자 역할에 따라 메뉴 필터링 (재귀적으로 처리)
  const filterMenuByRole = (items: TMenuConfig): TMenuConfig => {
    if (!items || !Array.isArray(items)) return [];

    return items.reduce<TMenuConfig>((acc, item) => {
      // authCheck 함수가 있다면 역할 검사를 수행
      if (item.authCheck && !item.authCheck(userRole || '')) {
        return acc; // 권한이 없으면 제외
      }

      // 자식 메뉴가 있는 경우 재귀적으로 필터링
      if (item.children && Array.isArray(item.children)) {
        const filteredChildren = filterMenuByRole(item.children);

        // 자식 메뉴도 필터링한 후 메뉴 항목 추가
        if (filteredChildren.length > 0 || !item.children.length) {
          acc.push({
            ...item,
            children: filteredChildren
          });
        }
      } else {
        // 자식 메뉴가 없는 경우 그대로 추가
        acc.push(item);
      }

      return acc;
    }, []);
  };

  // 메뉴 구성을 사용자 역할에 따라 필터링
  const filteredMenuConfig = filterMenuByRole(MENU_SIDEBAR);

  const build = (items: TMenuConfig) => {
    // 필터링된 메뉴 항목이 없으면 빈 Fragment 반환
    if (!items || items.length === 0) {
      return <Fragment />;
    }

    // 각 메뉴 항목 찾기 (사이드바 메뉴 구조 기준)
    const homeItem = items.find(item => item.path === '/' && item.title === 'Dashboard');
    const noticeItem = items.find(item => item.path === '/notice');
    const faqItem = items.find(item => item.path === '/faq');
    const sitemapItem = items.find(item => item.path === '/sitemap');

    // 서비스 관련 항목들 찾기
    const campaignItem = items.find(item => !item.heading && item.title === '캠페인 소개');

    // 내 정보 관리 관련 항목들 찾기
    const myInfoItem = items.find(item => !item.heading && item.title === 'My 페이지');


    const linkClass =
      'menu-link text-sm text-gray-700 font-medium menu-link-hover:text-primary menu-item-active:text-gray-900 menu-item-show:text-primary menu-item-here:text-gray-900';
    const titleClass = 'text-nowrap';

    return (
      <Fragment>
        {/* 홈(대시보드) 메뉴 항목 */}
        {homeItem && (
          <MenuItem key="home">
            <MenuLink path={homeItem.path} className={linkClass}>
              <MenuTitle className={titleClass}>{homeItem.title}</MenuTitle>
            </MenuLink>
          </MenuItem>
        )}

        {/* 공지사항 메뉴 항목 */}
        {noticeItem && (
          <MenuItem key="notice">
            <MenuLink path={noticeItem.path} className={linkClass}>
              <MenuTitle className={titleClass}>{noticeItem.title}</MenuTitle>
            </MenuLink>
          </MenuItem>
        )}

        {/* FAQ 메뉴 항목 */}
        {faqItem && (
          <MenuItem key="faq">
            <MenuLink path={faqItem.path} className={linkClass}>
              <MenuTitle className={titleClass}>{faqItem.title}</MenuTitle>
            </MenuLink>
          </MenuItem>
        )}

        {/* 사이트맵 메뉴 항목 */}
        {sitemapItem && (
          <MenuItem key="sitemap">
            <MenuLink path={sitemapItem.path} className={linkClass}>
              <MenuTitle className={titleClass}>{sitemapItem.title}</MenuTitle>
            </MenuLink>
          </MenuItem>
        )}

        {/* 서비스 메뉴 항목 */}
        {campaignItem && (
          <MenuItem
            key="services"
            toggle={desktopMode ? 'dropdown' : 'accordion'}
            trigger={desktopMode ? 'hover' : 'click'}
            dropdownProps={{
              placement: isRTL() ? 'bottom-end' : 'bottom-start'
            }}
          >
            <MenuLink className={linkClass}>
              <MenuTitle className={titleClass}>캠페인 소개</MenuTitle>
              {buildArrow()}
            </MenuLink>
            {MegaMenuSubService(filteredMenuConfig, 0)}
          </MenuItem>
        )}

        {/* 내 정보 관리 메뉴 항목 */}
        {myInfoItem && (
          <MenuItem
            key="my-info"
            toggle={desktopMode ? 'dropdown' : 'accordion'}
            trigger={desktopMode ? 'hover' : 'click'}
            dropdownProps={{
              placement: isRTL() ? 'bottom-end' : 'bottom-start'
            }}
          >
            <MenuLink className={linkClass}>
              <MenuTitle className={titleClass}>내 정보 관리</MenuTitle>
              {buildArrow()}
            </MenuLink>
            {MegaMenuSubMyInfo(filteredMenuConfig, 0)}
          </MenuItem>
        )}

      </Fragment>
    );
  };

  const buildArrow = () => {
    return (
      <MenuArrow className="flex lg:hidden text-gray-400">
        <KeenIcon icon="plus" className="text-2xs menu-item-show:hidden" />
        <KeenIcon icon="minus" className="text-2xs hidden menu-item-show:inline-flex" />
      </MenuArrow>
    );
  };

  return (
    <Menu
      multipleExpand={true}
      disabled={disabled}
      highlight={true}
      className="flex-col lg:flex-row gap-5 lg:gap-7.5 p-5 lg:p-0"
    >
      {build(filteredMenuConfig)}
    </Menu>
  );
};

export { MegaMenuInner };