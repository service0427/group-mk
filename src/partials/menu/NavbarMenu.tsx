import { KeenIcon } from '@/components';
import {
  Menu,
  TMenuConfig,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle,
  MenuArrow
} from '@/components/menu';
import { useLanguage } from '@/i18n';

const NavbarMenu = ({ items }: { items: TMenuConfig }) => {
  const { isRTL } = useLanguage();

  const buildMenu = (items: TMenuConfig) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <MenuItem
            key={index}
            className="border-b-2 border-b-transparent menu-item-active:border-b-primary menu-item-here:border-b-primary"
            toggle="dropdown"
            trigger="hover"
            dropdownProps={{
              placement: isRTL() ? 'bottom-end' : 'bottom-start',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 0] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuLink className="gap-1.5 pb-2 lg:pb-4 px-2">
              <MenuTitle className="text-nowrap text-sm text-gray-700 menu-item-active:text-primary menu-item-active:font-medium menu-item-here:text-primary menu-item-here:font-medium menu-item-show:text-primary menu-link-hover:text-primary">
                {item.title}
              </MenuTitle>

              <MenuArrow>
                <KeenIcon
                  icon="down"
                  className="text-2xs text-gray-500 menu-item-active:text-primary menu-item-here:text-primary menu-item-show:text-primary menu-link-hover:text-primary"
                />
              </MenuArrow>
            </MenuLink>
            <MenuSub className="menu-default" rootClassName="py-2 min-w-[200px]">
              {buildMenuSub(item.children)}
            </MenuSub>
          </MenuItem>
        );
      } else {
        return (
          <MenuItem
            key={index}
            className="border-b-2 border-b-transparent menu-item-active:border-b-primary menu-item-here:border-b-primary"
          >
            <MenuLink path={item.path} className="gap-1.5 pb-2 lg:pb-4 px-2">
              <MenuTitle className="text-nowrap font-medium text-sm text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-item-here:text-primary menu-item-here:font-semibold menu-item-show:text-primary menu-link-hover:text-primary">
                {item.title}
              </MenuTitle>
            </MenuLink>
          </MenuItem>
        );
      }
    });
  };

  const buildMenuSub = (items: TMenuConfig) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <MenuItem
            key={index}
            toggle="dropdown"
            trigger="hover"
            dropdownProps={{
              placement: isRTL() ? 'left-start' : 'right-start',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: isRTL() ? [10, 0] : [-10, 0] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuLink>
              <MenuTitle>{item.title}</MenuTitle>
              {buildMenuToggle()}
            </MenuLink>
            <MenuSub className="menu-default" rootClassName="py min-w-[200px]">
              {buildMenuSub(item.children)}
            </MenuSub>
          </MenuItem>
        );
      } else {
        return (
          <MenuItem key={index}>
            <MenuLink path={item.path}>
              <MenuTitle>{item.title}</MenuTitle>
            </MenuLink>
          </MenuItem>
        );
      }
    });
  };

  const buildMenuToggle = () => {
    return (
      <MenuArrow>
        <KeenIcon icon="down" className="text-2xs [.menu-dropdown_&]:-rotate-90" />
      </MenuArrow>
    );
  };

  return (
    <div className="grid">
      <div className="scrollable-x-auto">
        <Menu highlight={true} className="gap-3">
          {buildMenu(items)}
        </Menu>
      </div>
    </div>
  );
};

export { NavbarMenu };
