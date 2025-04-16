import { useLocation } from 'react-router';

import { useMenuCurrentItem } from '@/components/menu';
import { useMenus } from '@/providers';

import { IToolbarPageTitleProps } from './types';

const ToolbarPageTitle = ({ text, customTitle }: IToolbarPageTitleProps) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);

  // ?�선?�위: 1. text (명시??props), 2. customTitle (추�? props), 3. menuItem?.title (?�동)
  const title = text ?? customTitle ?? menuItem?.title;

  return (
    <h1 className="text-xl font-medium leading-none text-gray-900">{title}</h1>
  );
};

export { ToolbarPageTitle };
