import { KeenIcon } from '@/components';
import { TMenuConfig, MenuItem, MenuLink, MenuTitle, MenuIcon, MenuBadge } from '@/components/menu';
import clsx from 'clsx';
import { ReactNode } from 'react';

const MegaMenuSubHighlighted = (items: TMenuConfig) => {
  const buildItems = (items: TMenuConfig): ReactNode => {
    return items.map((item, index) => {
      return (
        <MenuItem key={index}>
          <MenuLink
            path={item.path}
            className="
            menu-link border border-transparent
            menu-link-hover:!bg-light menu-link-hover:border-gray-200
            menu-item-active:!bg-light menu-item-active:border-gray-200
          dark:menu-link-hover:!bg-coal-600 dark:menu-link-hover:border-gray-100
          dark:menu-item-active:!bg-coal-600 dark:menu-item-active:border-gray-100
          "
          >
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
    });
  };

  return buildItems(items);
};

export { MegaMenuSubHighlighted };
