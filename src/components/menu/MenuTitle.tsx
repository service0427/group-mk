import clsx from 'clsx';
import { memo } from 'react';

import { IMenuTitleProps } from './';

const MenuTitleComponent = ({ className, children }: IMenuTitleProps) => {
  return <div className={clsx('menu-title', className && className)}>{children}</div>;
};

const MenuTitle = memo(MenuTitleComponent);
export { MenuTitle };
