import clsx from 'clsx';

import { IMenuIconProps } from './';

const MenuIcon = ({ className, children }: IMenuIconProps) => {
  return <div className={clsx('menu-icon', className && className)}>{children}</div>;
};

export { MenuIcon };
