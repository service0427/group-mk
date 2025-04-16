import { useLocation } from 'react-router';

import { useMenuCurrentItem } from '@/components/menu';
import { useMenus } from '@/providers';

import { IToolbarPageTitleProps } from './types';

const ToolbarPageTitle = ({ text, customTitle }: IToolbarPageTitleProps) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);

  // ?°ì„ ?œìœ„: 1. text (ëª…ì‹œ??props), 2. customTitle (ì¶”ê? props), 3. menuItem?.title (?ë™)
  const title = text ?? customTitle ?? menuItem?.title;

  return (
    <h1 className="text-xl font-medium leading-none text-gray-900">{title}</h1>
  );
};

export { ToolbarPageTitle };
