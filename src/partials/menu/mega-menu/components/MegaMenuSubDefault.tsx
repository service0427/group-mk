import { KeenIcon } from '@/components';
import { TMenuConfig, MenuItem, MenuLink, MenuTitle, MenuIcon, MenuBadge } from '@/components/menu';
import clsx from 'clsx';
import { ReactNode } from 'react';

const MegaMenuSubDefault = (items: TMenuConfig) => {
  const buildItems = (items: TMenuConfig): ReactNode => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <div key={index}>
            <MenuItem className="pt-1">
              <span className="text-gray-600 font-medium text-2sm p-2.5">{item.title}</span>
            </MenuItem>
            {buildItems(item.children)}
          </div>
        );
      } else {
        return (
          <MenuItem key={index}>
            <MenuLink path={item.path}>
              {item.icon && (
                <MenuIcon>
                  <KeenIcon icon={item.icon} />
                </MenuIcon>
              )}

              <MenuTitle className={clsx('grow-0')}>{item.title}</MenuTitle>

              {item.disabled && (
                <MenuBadge>
                  <span className="badge badge-xs">Soon</span>
                </MenuBadge>
              )}

              {item.badge && (
                <MenuBadge>
                  <span className="badge badge-primary badge-outline badge-xs">{item.badge}</span>
                </MenuBadge>
              )}
            </MenuLink>
          </MenuItem>
        );
      }
    });
  };

  return buildItems(items);
};

export { MegaMenuSubDefault };
