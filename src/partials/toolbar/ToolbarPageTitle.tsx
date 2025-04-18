import { useLocation } from 'react-router';

import { useMenuCurrentItem } from '@/components/menu';
import { useMenus } from '@/providers';

import { IToolbarPageTitleProps } from './types';

const ToolbarPageTitle = ({ text, customTitle }: IToolbarPageTitleProps) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);

  // ?°μ ?μ: 1. text (λͺμ??props), 2. customTitle (μΆκ? props), 3. menuItem?.title (?λ)
  const title = text ?? customTitle ?? menuItem?.title;

  return (
    <h1 className="text-xl font-medium leading-none text-gray-900">{title}</h1>
  );
};

export { ToolbarPageTitle };
