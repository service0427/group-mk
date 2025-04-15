import { ReactNode } from 'react';
import { useMenus } from '@/providers';
import { useMenuCurrentItem } from '@/components';
import { useLocation } from 'react-router';
import { ToolbarBreadcrumbs } from './ToolbarBreadcrumbs';

export interface IToolbarHeadingProps {
  title?: string | ReactNode;
}

const ToolbarHeading = ({ title = '' }: IToolbarHeadingProps) => {
  const { getMenuConfig } = useMenus();
  const { pathname } = useLocation();
  const currentMenuItem = useMenuCurrentItem(pathname, getMenuConfig('primary'));

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-medium text-lg text-gray-900">{title || currentMenuItem?.title}</h1>
      <ToolbarBreadcrumbs />
    </div>
  );
};

export { ToolbarHeading };
