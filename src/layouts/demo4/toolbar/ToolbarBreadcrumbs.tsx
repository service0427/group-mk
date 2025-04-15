import { Fragment } from 'react';
import { useMenuBreadcrumbs } from '@/components';
import { Link } from 'react-router-dom';
import { useMenus } from '@/providers';
import { useLocation } from 'react-router';

const ToolbarBreadcrumbs = () => {
  const { getMenuConfig } = useMenus();
  const { pathname } = useLocation();
  const items = useMenuBreadcrumbs(pathname, getMenuConfig('primary'));

  return (
    <div className="flex items-center flex-wrap gap-1 text-sm">
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.path ? (
            <Link to={item.path} className="text-gray-700 hover:text-primary">
              {item.title}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-gray-900' : 'text-gray-700'}>
              {item.title}
            </span>
          )}
          {index !== items.length - 1 && <span className="text-gray-400 text-sm">/</span>}
        </Fragment>
      ))}
    </div>
  );
};

export { ToolbarBreadcrumbs };
