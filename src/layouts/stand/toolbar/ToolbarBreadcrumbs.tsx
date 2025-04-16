import { Fragment } from 'react';
import { KeenIcon, useMenuBreadcrumbs } from '@/components';
import { Link } from 'react-router-dom';
import { useMenus } from '@/providers';
import { useLocation } from 'react-router';

const ToolbarBreadcrumbs = () => {
  const { getMenuConfig } = useMenus();
  const { pathname } = useLocation();
  const items = useMenuBreadcrumbs(pathname, getMenuConfig('primary'));

  return (
    <div className="flex [.header_&]:below-lg:hidden items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0">
      <div className="breadcrumb flex items-center gap-1">
        {items.map((item, index) => (
          <Fragment key={index}>
            {item.path ? (
              <Link
                to={item.path}
                className="flex items-center gap-1 text-gray-600 hover:text-primary"
              >
                {item.title}
              </Link>
            ) : (
              <span className={index === items.length - 1 ? 'text-gray-700' : 'text-gray-700'}>
                {item.title}
              </span>
            )}
            {index !== items.length - 1 && (
              <KeenIcon icon="right" className="text-gray-500 text-3xs" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export { ToolbarBreadcrumbs };
