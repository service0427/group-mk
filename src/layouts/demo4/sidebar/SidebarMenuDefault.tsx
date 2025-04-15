import clsx from 'clsx';

import { KeenIcon } from '@/components/keenicons';
import {
  IMenuItemConfig,
  Menu,
  MenuArrow,
  TMenuConfig,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle
} from '@/components/menu';
import { useMenus } from '@/providers';

const SidebarMenuDefault = () => {
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('secondary');
  const indention = ['ps-2.5', 'ps-5', 'px-7'];

  const buildMenu = (items: TMenuConfig) => {
    return items.map((item, index) => {
      if (!item.disabled) {
        return buildMenuItem(item, index);
      }
    });
  };

  const buildMenuItem = (item: IMenuItemConfig, index: number, level: number = 0) => {
    if (item.children) {
      return (
        <MenuItem
          key={index}
          toggle="accordion"
          trigger="click"
          className={item.collapse ? 'flex-col-reverse' : ''}
        >
          <MenuLink
            className={clsx(
              'py-2 pe-2.5 rounded-md border border-transparent',
              indention[level - 1]
            )}
          >
            {item.collapse ? (
              <MenuTitle className="text-2sm text-gray-600 menu-link-hover:text-gray-900">
                <span className="hidden menu-item-show:!flex">{item.collapseTitle}</span>
                <span className="flex menu-item-show:hidden">{item.expandTitle}</span>
              </MenuTitle>
            ) : (
              <MenuTitle className="text-2sm text-gray-800 menu-item-here:text-gray-900 menu-item-show:text-gray-900 menu-link-hover:text-gray-900">
                {item.title}
              </MenuTitle>
            )}
            {buildMenuArrow()}
          </MenuLink>
          <MenuSub className="menu-accordion gap-px">
            {buildMenuChildren(item.children, item.collapse ? level : level + 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'py-2 pe-2.5 rounded-md border border-transparent menu-item-active:border-gray-200 menu-item-active:bg-light menu-link-hover:bg-light menu-link-hover:border-gray-200',
              indention[level]
            )}
          >
            <MenuTitle className="text-2sm text-gray-800 menu-item-active:font-medium menu-item-active:text-primary menu-link-hover:text-primary">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuChildren = (items: TMenuConfig, level: number) => {
    return items.map((item, index) => {
      if (!item.disabled) {
        return buildMenuItem(item, index, level);
      }
    });
  };

  const buildMenuArrow = () => {
    return (
      <MenuArrow className="text-gray-500">
        <KeenIcon icon="down" className="text-3xs menu-item-show:hidden" />
        <KeenIcon icon="up" className="text-3xs hidden menu-item-show:inline-flex" />
      </MenuArrow>
    );
  };

  return (
    <Menu highlight={true} multipleExpand={false} className="flex flex-col w-full gap-px px-2.5">
      {menuConfig && buildMenu(menuConfig)}
    </Menu>
  );
};

export { SidebarMenuDefault };
