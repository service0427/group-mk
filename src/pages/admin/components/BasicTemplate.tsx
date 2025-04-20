import React, { Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';

interface BasicTemplateProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // children 추가
}

const BasicTemplate: React.FC<BasicTemplateProps> = ({ title, description, children }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  
  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';
  
  // 페이지 타이틀 생성
  const pageTitle = title || "페이지";
  
  // 페이지 설명 생성
  const pageDescription = description || `${parentMenu} > ${pageTitle}`;
  
  return React.createElement(
    Fragment,
    null,
    React.createElement(
      Container,
      null,
      React.createElement(
        Toolbar,
        null,
        React.createElement(
          ToolbarHeading,
          null,
          React.createElement(ToolbarPageTitle, { customTitle: pageTitle }),
          React.createElement(ToolbarDescription, null, pageDescription)
        )
      )
    ),
    React.createElement(
      Container,
      null,
      React.createElement(
        'div',
        { className: "grid gap-5 lg:gap-7.5" },
        React.createElement(
          'div',
          { className: "bg-card rounded-lg shadow-sm overflow-hidden" },
          React.createElement(
            'div',
            { className: "p-5 flex justify-between items-center border-b" },
            React.createElement(
              'h3',
              { className: "text-lg font-medium text-card-foreground" },
              `${pageTitle} 정보`
            )
          ),
          React.createElement(
            'div',
            { className: "p-5" },
            React.createElement(
              'p',
              { className: "text-foreground" },
              "이 페이지는 준비중입니다. 곧 서비스가 제공될 예정입니다"
            )
          )
        )
      )
    )
  );
};

export default BasicTemplate;