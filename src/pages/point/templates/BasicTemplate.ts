import React, { Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Navbar } from '@/partials/navbar';
import { ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';

interface BasicTemplateProps {
  title: string;
  description?: string;
}

const BasicTemplate: React.FC<BasicTemplateProps> = ({ title, description }) => {
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
      React.createElement(Navbar, null),
      React.createElement(
        ToolbarHeading,
        null,
        React.createElement(ToolbarPageTitle, { customTitle: pageTitle }),
        React.createElement(ToolbarDescription, null, pageDescription)
      )
    ),
    React.createElement(
      Container,
      null,
      React.createElement(
        'div',
        { className: "flex flex-col items-stretch gap-5 lg:gap-7.5" },
        React.createElement(
          'div',
          { className: "flex flex-col p-5 bg-white rounded-lg shadow-sm" },
          React.createElement(
            'h3',
            { className: "text-lg font-medium text-gray-900 mb-4" },
            `${pageTitle} 페이지입니다.`
          ),
          React.createElement(
            'p',
            { className: "text-gray-600" },
            "이 페이지는 준비 중입니다. 곧 서비스가 제공될 예정입니다."
          )
        )
      )
    )
  );
};

export default BasicTemplate;