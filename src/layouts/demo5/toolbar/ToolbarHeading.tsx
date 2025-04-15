import { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useMenus } from '@/providers';
import { useMenuCurrentItem } from '@/components';

import { ToolbarBreadcrumbs } from '.';

export interface IToolbarHeadingProps {
  title?: string | ReactNode;
  description?: string | ReactNode;
}

const ToolbarHeading = ({ title = '' }: IToolbarHeadingProps) => {
  const { getMenuConfig } = useMenus();
  const { pathname } = useLocation();
  const currentMenuItem = useMenuCurrentItem(pathname, getMenuConfig('primary'));

  return (
    <div className="flex items-center flex-wrap gap-1 lg:gap-5">
      <h1 className="font-medium text-lg text-gray-900">{title || currentMenuItem?.title}</h1>
      <div className="flex items-center gap-1 text-sm font-normal">
        <ToolbarBreadcrumbs />
      </div>
    </div>
  );
};

export { ToolbarHeading };
