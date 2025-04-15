import clsx from 'clsx';

import { IMenuBadgeProps } from './';

const MenuBadge = ({ className, children }: IMenuBadgeProps) => {
  return <div className={clsx('menu-badge', className && className)}>{children}</div>;
};

export { MenuBadge };
