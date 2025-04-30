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
  hideDescription?: boolean;        // 설명 숨김 여부 (기본값: false)
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
  hideDescription = false,
  toolbarActions,
  container = true,
  fullWidth = true,
  containerClassName = "",
  children,
  childrenClassName = "grid gap-2 lg:gap-3 pb-2"  // 간격을 최소화
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

  // 컨텐츠 렌더링 함수 - 비어있을 경우 "작업 중" 메시지 표시
  const renderContent = () => {
    // 컨텐츠가 비어있는지 확인
    const isEmpty = !children || 
      (React.Children.count(children) === 0) || 
      (React.isValidElement(children) && React.Children.toArray(children).length === 0);
    
    return (
      <div className={contentClasses}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">이 페이지는 작업 중입니다</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">현재 콘텐츠가 준비되지 않았습니다. 곧 서비스를 제공할 예정입니다.</p>
          </div>
        ) : (
          children
        )}
      </div>
    );
  };

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
            {!hideDescription && (
              <ToolbarDescription>
                {pageDescription}
              </ToolbarDescription>
            )}
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