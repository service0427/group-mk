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

const SidebarMenu = () => {
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
    if (item.children) {
      return (
        <MenuItem
          key={index}
          {...(item.toggle && { toggle: item.toggle })}
          {...(item.trigger && { trigger: item.trigger })}
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
              {item.icon && <KeenIcon icon={item.icon} className={iconSize} />}
            </MenuIcon>
            <MenuTitle className="text-sm font-medium text-gray-800 menu-item-active:text-primary menu-link-hover:!text-primary">
              {item.title}
            </MenuTitle>
            {buildMenuArrow()}
          </MenuLink>
          <MenuSub
            className={clsx(
              'relative before:absolute before:top-0 before:bottom-0 before:border-s before:border-gray-200',
              itemsGap,
              accordionBorderLeft[0],
              accordionPl[0]
            )}
          >
            {buildMenuItemChildren(item.children, index, 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'border border-transparent menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg',
              accordionLinkGap[0],
              linkPy,
              linkPl,
              linkPr
            )}
          >
            <MenuIcon
              className={clsx(
                'items-start text-gray-600 dark:text-gray-500 menu-item-active:text-primary menu-link-hover:!text-primary',
                iconWidth
              )}
            >
              {item.icon && <KeenIcon icon={item.icon} className={iconSize} />}
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
            {item.icon && <KeenIcon icon={item.icon} className={iconSize} />}
          </MenuIcon>
          <MenuTitle className="text-sm font-medium text-gray-800">{item.title}</MenuTitle>

          {item.disabled && buildMenuSoon()}
        </MenuLabel>
      </MenuItem>
    );
  };

  const buildMenuItemChildren = (items: TMenuConfig, index: number, level: number = 0) => {
    return items.map((item, index) => {
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, index, level);
      } else {
        return buildMenuItemChild(item, index, level);
      }
    });
  };

  const buildMenuItemChild = (item: IMenuItemConfig, index: number, level: number = 0) => {
    if (item.children) {
      return (
        <MenuItem
          key={index}
          {...(item.toggle && { toggle: item.toggle })}
          {...(item.trigger && { trigger: item.trigger })}
          className={clsx(item.collapse && 'flex-col-reverse')}
        >
          <MenuLink
            className={clsx(
              'border border-transparent grow cursor-pointer',
              accordionLinkGap[level],
              accordionLinkPl,
              linkPr,
              subLinkPy,
              isMobile && 'mobile-submenu-link' // 모바일용 클래스 추가
            )}
          >
            {buildMenuBullet()}

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
              !item.collapse &&
                'relative before:absolute before:top-0 before:bottom-0 before:border-s before:border-gray-200',
              itemsGap,
              !item.collapse && accordionBorderLeft[level],
              !item.collapse && accordionPl[level],
              !item.collapse && 'relative before:absolute',
              isMobile && 'mobile-submenu' // 모바일용 클래스 추가
            )}
          >
            {buildMenuItemChildren(item.children, index, item.collapse ? level : level + 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg',
              accordionLinkGap[level],
              accordionLinkPl,
              linkPr,
              subLinkPy,
              isMobile && 'mobile-menu-link' // 모바일용 클래스 추가
            )}
          >
            {buildMenuBullet()}
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

  return (
    <Menu highlight={true} multipleExpand={false} className={clsx('flex flex-col grow sidebar-menu', itemsGap)}>
      {menuConfig && buildMenu(menuConfig)}
    </Menu>
  );
};

export { SidebarMenu };