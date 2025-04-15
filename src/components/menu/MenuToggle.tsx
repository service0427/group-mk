import clsx from 'clsx';

import { IMenuToggleProps } from './';

const MenuToggle = ({
  className,
  hasItemSub = false,
  handleToggle,
  children
}: IMenuToggleProps) => {
  if (hasItemSub) {
    return (
      <div className={clsx('menu-toggle', className && className)} onClick={handleToggle}>
        {children}
      </div>
    );
  } else {
    return <div className={clsx('menu-toggle', className && className)}>{children}</div>;
  }
};

export { MenuToggle };
