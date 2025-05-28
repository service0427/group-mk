import clsx from 'clsx';

import { KeenIcon } from '@/components/keenicons';
import {
  IMenuItemConfig,
  Menu,
  MenuArrow,
  MenuBadge,
  MenuBullet,
  TMenuConfig,
  MenuHeading,
  MenuIcon,
  MenuItem,
  MenuLabel,
  MenuLink,
  MenuSub,
  MenuTitle
} from '@/components/menu';
import { useMenus } from '@/providers';
import { useResponsive } from '@/hooks';
import { useAuthContext } from '@/auth/useAuthContext';
import { useEffect } from 'react';

interface SidebarMenuProps {
  onMenuStateChange?: () => void;
}

const SidebarMenu = ({ onMenuStateChange }: SidebarMenuProps) => {
  const isMobile = !useResponsive('up', 'md');
  const linkPl = isMobile ? 'ps-[6px]' : 'ps-[8px]';
  const linkPr = isMobile ? 'pe-[6px]' : 'pe-[8px]';
  const linkPy = isMobile ? 'py-[5px]' : 'py-[6px]';
  const itemsGap = isMobile ? 'gap-0.25' : 'gap-0.5';
  const subLinkPy = isMobile ? 'py-[6px]' : 'py-[8px]';
  const rightOffset = isMobile ? 'me-[-8px]' : 'me-[-10px]';
  const iconWidth = isMobile ? 'w-[16px]' : 'w-[20px]';
  const iconSize = isMobile ? 'text-base' : 'text-lg';
  const accordionLinkPl = isMobile ? 'ps-[8px]' : 'ps-[10px]';
  const accordionLinkGap = [
    'gap-[5px]',  // 10px에서 5px로 줄임
    'gap-[8px]',  // 14px에서 8px로 줄임
    'gap-[3px]',  // 5px에서 3px로 줄임
    'gap-[3px]',  // 5px에서 3px로 줄임
    'gap-[3px]',  // 5px에서 3px로 줄임
    'gap-[3px]'   // 5px에서 3px로 줄임
  ];
  const accordionPl = [
    'ps-[10px]',
    'ps-[22px]',
    'ps-[22px]',
    'ps-[22px]',
    'ps-[22px]',
    'ps-[22px]'
  ];
  const accordionBorderLeft = [
    'before:start-[20px]',
    'before:start-[32px]',
    'before:start-[32px]',
    'before:start-[32px]',
    'before:start-[32px]'
  ];

  const buildMenu = (items: TMenuConfig) => {
    return items.map((item, index) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (item.disabled) {
        return buildMenuItemRootDisabled(item, index);
      } else {
        return buildMenuItemRoot(item, index);
      }
    });
  };

  const buildMenuItemRoot = (item: IMenuItemConfig, index: number) => {
    // 캠페인 소개 메뉴인지 확인
    const isCampaignIntroMenu = item.title === '캠페인 소개';
    
    if (item.children) {
      return (
        <MenuItem
          key={index}
          {...(item.toggle && { toggle: item.toggle })}
          {...(item.trigger && { trigger: item.trigger })}
          // 캠페인 소개 메뉴는 항상 열린 상태로 표시
          open={isCampaignIntroMenu}
        >
          <MenuLink
            className={clsx(
              'flex items-center grow cursor-pointer border border-transparent',
              accordionLinkGap[0],
              linkPl,
              linkPr,
              linkPy
            )}
          >
            <MenuIcon className={clsx('items-start text-gray-500 dark:text-gray-400', iconWidth)}>
              {item.iconImage ? (
                <img src={item.iconImage} alt={item.title} className="w-[18px] h-[18px]" />
              ) : item.icon && (
                <KeenIcon icon={item.icon} className={iconSize} />
              )}
            </MenuIcon>
            <MenuTitle className="text-sm font-medium text-gray-800 menu-item-active:text-primary menu-link-hover:!text-primary">
              {item.title}
            </MenuTitle>
            {buildMenuArrow()}
          </MenuLink>
          <MenuSub
            className={clsx(
              'relative',
              itemsGap,
              accordionPl[0]
            )}
            // 캠페인 소개 메뉴의 하위 항목은 항상 표시
            show={isCampaignIntroMenu}
          >
            {buildMenuItemChildren(item.children, index, 1, isCampaignIntroMenu)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'border border-transparent menu-item-active:bg-secondary-active dark:menu-item-active:bg-blue-950 dark:menu-item-active:border-blue-700 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-blue-950/50 dark:hover:border-blue-800 hover:rounded-lg',
              accordionLinkGap[0],
              linkPy,
              linkPl,
              linkPr
            )}
          >
            <MenuIcon
              className={clsx(
                'items-start text-gray-600 dark:text-gray-500 menu-item-active:text-primary dark:menu-item-active:text-blue-400 menu-link-hover:!text-primary dark:menu-link-hover:!text-blue-400',
                iconWidth
              )}
            >
              {item.iconImage ? (
                <img src={item.iconImage} alt={item.title} className="w-[18px] h-[18px]" />
              ) : item.icon && (
                <KeenIcon icon={item.icon} className={iconSize} />
              )}
            </MenuIcon>
            <MenuTitle className="text-sm font-medium text-gray-800 menu-item-active:text-primary menu-link-hover:!text-primary">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuItemRootDisabled = (item: IMenuItemConfig, index: number) => {
    return (
      <MenuItem key={index}>
        <MenuLabel
          className={clsx('border border-transparent', accordionLinkGap[0], linkPy, linkPl, linkPr)}
        >
          <MenuIcon className={clsx('items-start text-gray-500 dark:text-gray-400', iconWidth)}>
            {item.iconImage ? (
              <img src={item.iconImage} alt={item.title} className="w-6 h-6" />
            ) : item.icon && (
              <KeenIcon icon={item.icon} className={iconSize} />
            )}
          </MenuIcon>
          <MenuTitle className="text-sm font-medium text-gray-800">{item.title}</MenuTitle>

          {item.disabled && buildMenuSoon()}
        </MenuLabel>
      </MenuItem>
    );
  };

  const buildMenuItemChildren = (items: TMenuConfig, index: number, level: number = 0, isParentCampaignIntro: boolean = false) => {
    return items.map((item, idx) => {
      // 상위 메뉴가 캠페인 소개 메뉴인 경우 표시
      const shouldAlwaysShow = isParentCampaignIntro;
      
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, idx, level);
      } else {
        return buildMenuItemChild(item, idx, level, shouldAlwaysShow);
      }
    });
  };

  const buildMenuItemChild = (item: IMenuItemConfig, index: number, level: number = 0, alwaysShow: boolean = false) => {
    // 네이버 메뉴인지 확인 (캠페인 소개 > 네이버)
    const isNaverMenu = item.title === '네이버';
    
    if (item.children) {
      return (
        <MenuItem
          key={index}
          {...(item.toggle && { toggle: item.toggle })}
          {...(item.trigger && { trigger: item.trigger })}
          className={clsx(item.collapse && 'flex-col-reverse')}
          // 상위 메뉴가 캠페인 소개이거나 네이버 메뉴인 경우 항상 열림
          open={alwaysShow || isNaverMenu}
        >
          <MenuLink
            className={clsx(
              'border border-transparent grow cursor-pointer',
              'menu-has-active-child:text-primary dark:menu-has-active-child:text-blue-400 menu-has-active-child:font-semibold',
              accordionLinkGap[level],
              accordionLinkPl,
              linkPr,
              subLinkPy,
              isMobile && 'mobile-submenu-link' // 모바일용 클래스 추가
            )}
          >
            {item.iconImage ? (
              <MenuIcon className="items-center text-gray-600 dark:text-gray-500 menu-item-active:text-primary dark:menu-item-active:text-blue-400 menu-link-hover:!text-primary dark:menu-link-hover:!text-blue-400 w-[18px] mr-1.5">
                <img src={item.iconImage} alt={item.title} className="w-[18px] h-[18px]" />
              </MenuIcon>
            ) : item.icon ? (
              <MenuIcon className="items-center text-gray-600 dark:text-gray-500 menu-item-active:text-primary dark:menu-item-active:text-blue-400 menu-link-hover:!text-primary dark:menu-link-hover:!text-blue-400 w-[18px] mr-1.5">
                <KeenIcon icon={item.icon} className="text-base" />
              </MenuIcon>
            ) : buildMenuBullet()}

            {item.collapse ? (
              <MenuTitle className="text-2sm font-normal text-gray-600 dark:text-gray-500">
                <span className="hidden menu-item-show:!flex">{item.collapseTitle}</span>
                <span className="flex menu-item-show:hidden">{item.expandTitle}</span>
              </MenuTitle>
            ) : (
              <MenuTitle className="text-2sm font-normal me-1 text-gray-800 menu-item-active:text-primary menu-item-active:font-medium menu-link-hover:!text-primary">
                {item.title}
              </MenuTitle>
            )}

            {buildMenuArrow()}
          </MenuLink>
          <MenuSub
            className={clsx(
              !item.collapse && 'relative',
              itemsGap,
              !item.collapse && accordionPl[level],
              isMobile && 'mobile-submenu' // 모바일용 클래스 추가
            )}
            // 상위 메뉴가 캠페인 소개이거나 네이버 메뉴인 경우 항상 표시
            show={alwaysShow || isNaverMenu}
          >
            {buildMenuItemChildren(item.children, index, item.collapse ? level : level + 1, alwaysShow || isNaverMenu)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-blue-950 dark:menu-item-active:border-blue-700 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-blue-950/50 dark:hover:border-blue-800 hover:rounded-lg',
              accordionLinkGap[level],
              accordionLinkPl,
              linkPr,
              subLinkPy,
              isMobile && 'mobile-menu-link' // 모바일용 클래스 추가
            )}
          >
            {item.iconImage ? (
              <MenuIcon className="items-center text-gray-600 dark:text-gray-500 menu-item-active:text-primary dark:menu-item-active:text-blue-400 menu-link-hover:!text-primary dark:menu-link-hover:!text-blue-400 w-[18px] mr-1.5">
                <img src={item.iconImage} alt={item.title} className="w-[18px] h-[18px]" />
              </MenuIcon>
            ) : item.icon ? (
              <MenuIcon className="items-center text-gray-600 dark:text-gray-500 menu-item-active:text-primary dark:menu-item-active:text-blue-400 menu-link-hover:!text-primary dark:menu-link-hover:!text-blue-400 w-[18px] mr-1.5">
                <KeenIcon icon={item.icon} className="text-base" />
              </MenuIcon>
            ) : buildMenuBullet()}
            <MenuTitle className="text-2sm font-normal text-gray-800 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuItemChildDisabled = (item: IMenuItemConfig, index: number, level: number = 0) => {
    return (
      <MenuItem key={index}>
        <MenuLabel
          className={clsx(
            'border border-transparent items-center grow',
            accordionLinkGap[level],
            accordionLinkPl,
            linkPr,
            subLinkPy
          )}
        >
          {buildMenuBullet()}
          <MenuTitle className="text-2sm font-normal text-gray-800">{item.title}</MenuTitle>
          {item.disabled && buildMenuSoon()}
        </MenuLabel>
      </MenuItem>
    );
  };

  const buildMenuHeading = (item: IMenuItemConfig, index: number) => {
    return (
      <MenuItem key={index} className="pt-2.25 pb-px">
        <MenuHeading
          className={clsx('uppercase text-2sm font-medium text-gray-500', linkPl, linkPr)}
        >
          {item.heading}
        </MenuHeading>
      </MenuItem>
    );
  };

  const buildMenuArrow = () => {
    return (
      <MenuArrow className={clsx('text-gray-400 w-[20px] shrink-0 justify-end ms-1', rightOffset)}>
        <KeenIcon icon="plus" className="text-2xs menu-item-show:hidden" />
        <KeenIcon icon="minus" className="text-2xs hidden menu-item-show:inline-flex" />
      </MenuArrow>
    );
  };

  const buildMenuBullet = () => {
    // 모바일 및 PC 환경에 따라 다른 클래스 적용
    return (
      <MenuBullet className={clsx(
        "flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:start-0 rtl:before:translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary",
        isMobile ? "-start-[2px]" : "-start-[3px]" // 모바일에서는 더 왼쪽으로(-1px→-2px), PC에서는 기존 위치 유지
      )}></MenuBullet>
    );
  };

  const buildMenuSoon = () => {
    return (
      <MenuBadge className={rightOffset}>
        <span className="badge badge-xs">Soon</span>
      </MenuBadge>
    );
  };

  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const { userRole } = useAuthContext();

  // 메뉴 상태 변경 이벤트 리스너
  useEffect(() => {
    const handleMenuStateChange = () => {
      if (onMenuStateChange) {
        // 약간의 지연을 두어 DOM 업데이트 후 실행
        setTimeout(onMenuStateChange, 100);
      }
    };

    window.addEventListener('menuStateChange', handleMenuStateChange);
    
    return () => {
      window.removeEventListener('menuStateChange', handleMenuStateChange);
    };
  }, [onMenuStateChange]);

  // 사용자 역할에 따라 메뉴 필터링 (재귀적으로 처리)
  const filterMenuByRole = (items: TMenuConfig): TMenuConfig => {
    if (!items || !Array.isArray(items)) return [];

    return items.reduce<TMenuConfig>((acc, item) => {
      // authCheck 함수가 있다면 역할 검사를 수행
      if (item.authCheck && !item.authCheck(userRole)) {
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

  // 전체 메뉴 구조를 재귀적으로 필터링
  const filteredMenuConfig = filterMenuByRole(menuConfig || []);

  return (
    <Menu 
      highlight={true} 
      multipleExpand={true} 
      className={clsx(
        'flex flex-col grow sidebar-menu', 
        itemsGap, 
        'h-full w-full',
        isMobile && 'mobile-sidebar-menu' // 모바일에서 추가 스타일 (CSS에서 처리)
      )}
    >
      {filteredMenuConfig && buildMenu(filteredMenuConfig)}
    </Menu>
  );
};

export { SidebarMenu };