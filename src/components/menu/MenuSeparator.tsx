import clsx from 'clsx';

import { IMenuSeparatorProps } from './';

const MenuSeparator = ({ className }: IMenuSeparatorProps) => {
  return <div className={clsx('menu-separator', className && className)}></div>;
};

export { MenuSeparator };
