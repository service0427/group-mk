import { useLocation } from 'react-router';
import { useMenuCurrentItem } from '@/components/menu';
import { useMenus } from '@/providers';

import { IToolbarPageTitleProps } from './types';

const ToolbarPageTitle = ({ text, customTitle }: IToolbarPageTitleProps) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);

  // 우선순위: 1. text (명시적 props), 2. customTitle (추가 props), 3. menuItem?.title (자동)
  const title = text ?? customTitle ?? menuItem?.title;

  return (
    <h1 className="text-xl font-medium leading-none text-gray-900">{title}</h1>
  );
};

export { ToolbarPageTitle };
