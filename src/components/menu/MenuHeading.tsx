import clsx from 'clsx';

import { IMenuHeadingProps } from './';

const MenuHeading = ({ className, children }: IMenuHeadingProps) => {
  return <div className={clsx('menu-heading', className && className)}>{children}</div>;
};

export { MenuHeading };
