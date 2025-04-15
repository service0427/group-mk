import clsx from 'clsx';

import { IMenuBulletProps } from './';

const MenuBullet = ({ className, children }: IMenuBulletProps) => {
  return <div className={clsx('menu-bullet', className && className)}>{children}</div>;
};

export { MenuBullet };
