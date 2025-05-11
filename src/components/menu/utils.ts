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
  const singlePagePaths = ['/notice', '/faq', '/sitemap', '/'];

  for (const child of childrenArray) {
    if (isValidElement(child)) {
      if (child.type === MenuLink && child.props.path) {
        // 단일 페이지 메뉴는 항상 활성화되지 않도록 처리
        if (singlePagePaths.includes(child.props.path)) {
          return false;
        }
        // 홈 경로는 정확히 일치하는 경우만 활성화
        else if (path === '/') {
          if (child.props.path === path) {
            return true;
          }
        } 
        // 다른 경로는 기존 로직 사용
        else if (matchPath(child.props.path as string, path)) {
          return true;
        }
      } else if (hasMenuActiveChild(path, child.props.children as ReactNode)) {
        return true;
      }
    }
  }

  return false;
};