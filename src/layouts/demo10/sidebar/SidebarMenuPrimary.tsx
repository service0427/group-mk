import clsx from 'clsx';
import { KeenIcon } from '@/components/keenicons';
import {
  IMenuItemConfig,
  Menu,
  MenuArrow,
  TMenuConfig,
  MenuIcon,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle
} from '@/components/menu';
import { useMenus } from '@/providers';

const SidebarMenuPrimary = () => {
  const newItem = {
    title: 'Overview',
    description: '',
    icon: 'home-3',
    path: '/'
  };

  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');

  // Prepend the new item to the menuConfig
  //const menuConfigWithNewItem = [newItem, ...menuConfig];

  const subIndetion = ['ps-7', 'ps-2.5', 'ps-2.5'];

  const buildMenu = (items: TMenuConfig) => {
    return items.map((item, index) => {
      if (!item.heading && !item.disabled && item.title !== 'Dashboards') {
        return buildMenuItemRoot(item, index, 0);
      }
      return null; // Ensure a return for the map
    });
  };

  const buildMenuItemRoot = (item: IMenuItemConfig, index: number, level: number) => {
    if (item.children) {
      return (
        <MenuItem key={index} toggle="accordion" trigger="click">
          <MenuLink className="gap-2.5 py-2 px-2.5 rounded-md !menu-item-hover:bg-transparent !menu-item-here:bg-transparent">
            <MenuIcon className="items-start text-gray-400 text-lg menu-item-here:text-gray-900 menu-item-show:text-gray-900 menu-link-hover:text-gray-900">
              {item.icon && <KeenIcon icon={item.icon} />}
            </MenuIcon>
            <MenuTitle className="font-medium text-sm text-gray-700 menu-item-here:text-gray-900 menu-item-show:text-gray-900 menu-link-hover:text-gray-900">
              {item.title}
            </MenuTitle>
            {buildMenuArrow()}
          </MenuLink>
          <MenuSub className={clsx('menu-accordion gap-px', subIndetion[level])}>
            {buildMenuItemChildren(item.children, index, level + 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className={clsx(
              'gap-2.5 py-2 px-2.5 rounded-md menu-item-active:bg-gray-100 menu-link-hover:bg-gray-100 !menu-item-here:bg-transparent',
              subIndetion[level]
            )}
          >
            <MenuIcon className="items-start text-lg text-gray-600 menu-item-active:text-gray-900 menu-item-here:text-gray-900">
              {item.icon && <KeenIcon icon={item.icon} />}
            </MenuIcon>
            <MenuTitle className="text-sm text-gray-800 font-medium menu-item-here:text-gray-900 menu-item-active:text-gray-900 menu-link-hover:text-gray-900">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuItemChildren = (items: TMenuConfig, index: number, level: number = 0) => {
    return items.map((item, index) => {
      if (!item.disabled) {
        return buildMenuItemChild(item, index, level);
      }
      return null; // Ensure a return for the map
    });
  };

  const buildMenuItemChild = (item: IMenuItemConfig, index: number, level: number = 0) => {
    if (item.children) {
      return (
        <MenuItem
          key={index}
          toggle="accordion"
          trigger="click"
          className={clsx(item.collapse && 'flex-col-reverse')}
        >
          <MenuLink className="py-2 px-2.5 rounded-md border border-transparent !menu-item-here:bg-transparent">
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
          <MenuSub className={clsx('menu-accordion gap-px', !item.collapse && subIndetion[level])}>
            {buildMenuItemChildren(item.children, index, item.collapse ? level : level + 1)}
          </MenuSub>
        </MenuItem>
      );
    } else {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className="py-2 px-2.5 rounded-md menu-item-active:bg-gray-100 menu-link-hover:bg-gray-100"
          >
            <MenuTitle className="text-2sm text-gray-800 menu-item-active:text-gray-900 menu-link-hover:text-gray-900">
              {item.title}
            </MenuTitle>
          </MenuLink>
        </MenuItem>
      );
    }
  };

  const buildMenuArrow = () => {
    return (
      <MenuArrow className="text-gray-400 menu-item-here:text-gray-400 menu-item-show:text-gray-800 menu-link-hover:text-gray-800">
        <KeenIcon icon="down" className="text-3xs menu-item-show:hidden" />
        <KeenIcon icon="up" className="text-3xs hidden menu-item-show:inline-flex" />
      </MenuArrow>
    );
  };

  return (
    <div className="mb-5">
      <h3 className="text-sm text-gray-500 uppercase ps-5 inline-block mb-3">Pages</h3>
      <Menu highlight={true} multipleExpand={false} className="flex flex-col w-full gap-1.5 px-3.5">
        {menuConfig && buildMenu(menuConfig)}
      </Menu>
    </div>
  );
};

export { SidebarMenuPrimary };
