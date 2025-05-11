import React from 'react';
import { CommonTemplate } from './CommonTemplate';
import { Container } from '@/components/container';
import { StyledToolbar } from '@/partials/toolbar';

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
  headerBgClass = "bg-info",
  headerTextClass = "text-white",
}) => {
  // 대시보드 컨텐츠 클래스
  const contentClasses = `grid gap-5 pb-5 ${childrenClassName}`;

  // 그라데이션 클래스 생성
  let gradientClass = headerBgClass;

  // CSS 정의 색상 처리 맵
  const colorMap: Record<string, string> = {
    'bg-purple-600': 'bg-gradient-to-r from-primary to-primary',
    'bg-blue-600': 'bg-gradient-to-r from-primary to-primary',
    'bg-indigo-600': 'bg-gradient-to-r from-info to-info',
    'bg-amber-600': 'bg-gradient-to-r from-warning to-warning',
    'bg-red-600': 'bg-gradient-to-r from-danger to-danger'
  };

  // 맵에 있는 색상인 경우 CSS 변수 사용
  if (colorMap[headerBgClass]) {
    gradientClass = colorMap[headerBgClass];
  }
  // 맵에 없는 기존 Tailwind 색상 처리
  else {
    // 색상 클래스에서 'bg-' 접두사 제거 (존재하는 경우)
    const colorClass = headerBgClass.replace(/^bg-/, '');

    // 마지막 강도(숫자) 부분만 추출
    const baseColorMatch = colorClass.match(/^(\w+(?:-\w+)?)-\d+$/);

    if (baseColorMatch && baseColorMatch[1]) {
      const baseColor = baseColorMatch[1]; // 예: 'blue', 'yellow'
      gradientClass = `bg-gradient-to-r from-${baseColor}-500 to-${baseColor}-600`;
    }
  }

  return (
    <div className="dashboard-template-wrapper">
      {/* 헤더 영역 - 커스텀 배경색 */}
      <Container fullWidth={fullWidth} className={`${containerClassName} mb-8 pt-5`}>
        <StyledToolbar
          title={title}
          description={description}
          hideDescription={hideDescription}
          toolbarActions={toolbarActions}
          bgClass={gradientClass}
          textClass={headerTextClass}
        />
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