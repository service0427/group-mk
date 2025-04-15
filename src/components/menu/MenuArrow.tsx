import clsx from 'clsx';

import { IMenuToggleProps } from './';

const MenuArrow = ({ className, children }: IMenuToggleProps) => {
  return <div className={clsx('menu-arrow', className && className)}>{children}</div>;
};

export { MenuArrow };
