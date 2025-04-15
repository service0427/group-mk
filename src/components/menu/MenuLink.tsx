import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { IMenuLinkProps } from './';

const MenuLink = ({
  path,
  newTab,
  hasItemSub = false,
  externalLink,
  className,
  handleToggle,
  handleClick,
  children
}: IMenuLinkProps) => {
  if (!hasItemSub && path) {
    if (externalLink) {
      const target = newTab ? '_blank' : '_self';

      return (
        <a
          href={path}
          target={target}
          rel="noopener"
          onClick={handleClick}
          className={clsx('menu-link', className && className)}
        >
          {children}
        </a>
      );
    } else {
      return (
        <Link to={path} onClick={handleClick} className={clsx('menu-link', className && className)}>
          {children}
        </Link>
      );
    }
  } else {
    if (hasItemSub) {
      return (
        <div className={clsx('menu-link', className && className)} onClick={handleToggle}>
          {children}
        </div>
      );
    } else {
      return (
        <div className={clsx('menu-link', className && className)} onClick={handleClick}>
          {children}
        </div>
      );
    }
  }
};

export { MenuLink };
