import { Children, isValidElement, ReactNode } from 'react';
import { MenuLink } from './MenuLink';
import { matchPath } from 'react-router';

export const getMenuLinkPath = (children: ReactNode): string => {
  let path = '';

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === MenuLink && child.props.path) {
      path = child.props.path; // Assign the path when found
    }
  });

  return path;
};

export const hasMenuActiveChild = (path: string, children: ReactNode): boolean => {
  const childrenArray: ReactNode[] = Children.toArray(children);

  for (const child of childrenArray) {
    if (isValidElement(child)) {
      if (child.type === MenuLink && child.props.path) {
        if (path === '/') {
          if (child.props.path === path) {
            return true;
          }
        } else {
          if (matchPath(child.props.path as string, path)) {
            return true;
          }
        }
      } else if (hasMenuActiveChild(path, child.props.children as ReactNode)) {
        return true;
      }
    }
  }

  return false;
};
