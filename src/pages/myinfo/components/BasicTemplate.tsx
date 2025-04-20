import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
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

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle={pageTitle} />
            <ToolbarDescription>{pageDescription}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      
      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium text-card-foreground">{pageTitle} 정보</h3>
            </div>
            <div className="p-5">
              <p className="text-foreground">이 페이지는 준비중입니다. 곧 서비스가 제공될 예정입니다</p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default BasicTemplate;