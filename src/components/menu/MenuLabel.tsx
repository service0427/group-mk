import clsx from 'clsx';
import { IMenuLabelProps } from './';

const MenuLabel = ({
  className,
  hasItemSub,
  handleToggle,
  handleClick,
  children
}: IMenuLabelProps) => {
  if (hasItemSub) {
    return (
      <div className={clsx('menu-label', className && className)} onClick={handleToggle}>
        {children}
      </div>
    );
  } else {
    return (
      <div className={clsx('menu-label', className && className)} onClick={handleClick}>
        {children}
      </div>
    );
  }
};

export { MenuLabel };
