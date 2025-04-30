import React, { Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/partials/pagemenu';

/**
 * 모든 페이지에서 사용할 수 있는 공통 템플릿
 * 페이지 제목, 설명, 액션 버튼 등을 일관되게 표시
 * 캠페인 소개 하위 페이지 스타일을 기준으로 제작
 * 
 * 고정된 마진과 패딩 값을 사용하여 일관된 레이아웃 제공
 * 복잡한 동적 계산을 제거하고 CSS 클래스 기반으로 변경
 */
interface CommonTemplateProps {
  title?: string;                   // 페이지 제목 (수동 지정)
  description?: string;             // 페이지 설명 (수동 지정) 
  showPageMenu?: boolean;           // 페이지 메뉴 표시 여부
  showBreadcrumb?: boolean;         // 브레드크럼 표시 여부 
  toolbarActions?: React.ReactNode; // 툴바 액션 버튼 영역
  container?: boolean;              // 컨테이너 사용 여부 (기본값: true)
  fullWidth?: boolean;              // 전체 너비 사용 여부 (기본값: true)
  containerClassName?: string;      // 컨테이너에 추가할 클래스
  children?: React.ReactNode;       // 컨텐츠 영역
  childrenClassName?: string;       // 컨텐츠 영역에 추가할 클래스
}

const CommonTemplate: React.FC<CommonTemplateProps> = ({
  title,
  description,
  showPageMenu = true,
  showBreadcrumb = true,
  toolbarActions,
  container = true,
  fullWidth = true,
  containerClassName = "",
  children,
  childrenClassName = "grid gap-4 lg:gap-5 pb-6"  // 더 조밀한 간격으로 조정
}) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2]?.title : '';

  // 페이지 타이틀 생성
  const pageTitle = title || menuItem?.title || "페이지";

  // 페이지 설명 생성 (description이 제공되지 않은 경우 breadcrumb 경로 사용)
  const pageDescription = description || (showBreadcrumb && parentMenu ? `${parentMenu} > ${pageTitle}` : pageTitle);

  // 페이지 템플릿에 적용할 클래스 (페이지 메뉴 표시 여부에 따라 다름)
  const pageTemplateClass = `page-template-wrapper ${showPageMenu ? 'pt-3' : 'pt-2 no-page-menu'}`;

  // 컨텐츠 클래스 구성 (기본 클래스 + 사용자 정의 클래스)
  const contentClasses = `template-content ${childrenClassName}`;

  // 컨텐츠 렌더링 함수
  const renderContent = () => (
    <div className={contentClasses}>
      {children}
    </div>
  );

  return (
    <div className={pageTemplateClass}>
      {/* 헤더 영역 */}
      <Container fullWidth={fullWidth} className={containerClassName}>
        {showPageMenu && (
          <Navbar>
            <PageMenu />
          </Navbar>
        )}

        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle={pageTitle} />
            <ToolbarDescription>
              {pageDescription}
            </ToolbarDescription>
          </ToolbarHeading>

          {toolbarActions && (
            <ToolbarActions className="flex flex-wrap gap-2">
              {toolbarActions}
            </ToolbarActions>
          )}
        </Toolbar>
      </Container>

      {/* 컨텐츠 영역 */}
      {container ? (
        <Container fullWidth={fullWidth} className={containerClassName}>
          {renderContent()}
        </Container>
      ) : (
        renderContent()
      )}
    </div>
  );
};

export { CommonTemplate };