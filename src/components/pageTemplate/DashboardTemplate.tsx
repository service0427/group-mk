import React from 'react';
import { CommonTemplate } from './CommonTemplate';
import { Container } from '@/components/container';

interface DashboardTemplateProps {
  title?: string;
  description?: string;
  showPageMenu?: boolean;
  showBreadcrumb?: boolean;
  hideDescription?: boolean;
  toolbarActions?: React.ReactNode;
  container?: boolean;
  fullWidth?: boolean;
  containerClassName?: string;
  childrenClassName?: string;
  children?: React.ReactNode;
  // 대시보드 특화 속성 추가
  headerBgClass?: string;
  headerTextClass?: string;
}

/**
 * 대시보드 페이지를 위한 템플릿 컴포넌트
 * - 상단에 그라데이션 배경과 함께 제목과 설명을 표시
 * - 컨텐츠 영역에 여러 행의 카드를 표시하는 그리드 레이아웃 제공
 * - 디자인 이미지에 맞춘 레이아웃과 스타일링
 */
export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  title = "대시보드",
  description = "대시보드에 오신 것을 환영합니다.",
  hideDescription = false,
  toolbarActions,
  container = true,
  fullWidth = true,
  containerClassName = "",
  childrenClassName = "",
  children,
  headerBgClass = "bg-indigo-600",
  headerTextClass = "text-white",
}) => {
  // 대시보드 컨텐츠 클래스
  const contentClasses = `grid gap-5 pb-5 ${childrenClassName}`;

  return (
    <div className="dashboard-template-wrapper">
      {/* 헤더 영역 - 커스텀 배경색 */}
      <Container fullWidth={fullWidth} className={`${containerClassName} mb-5`}>
        <div className={`${headerBgClass} ${headerTextClass} rounded-lg shadow-md px-5 py-4 dark:shadow-none`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-1">{title}</h2>
              {!hideDescription && (
                <p className="text-sm md:text-base opacity-80">{description}</p>
              )}
            </div>
            {toolbarActions && (
              <div className="mt-3 lg:mt-0 flex flex-wrap gap-2 justify-start lg:justify-end">
                {toolbarActions}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* 메인 컨텐츠 영역 - 직접 Container 사용 (CommonTemplate과 일관성 맞춤) */}
      {container ? (
        <Container fullWidth={fullWidth} className={containerClassName}>
          <div className={contentClasses}>
            {children}
          </div>
        </Container>
      ) : (
        <div className={contentClasses}>
          {children}
        </div>
      )}
    </div>
  );
};

export default DashboardTemplate;