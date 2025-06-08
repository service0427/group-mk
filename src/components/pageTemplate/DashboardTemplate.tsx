import React from 'react';
import { CommonTemplate } from './CommonTemplate';
import { Container } from '@/components/container';
import { StyledToolbar } from '@/partials/toolbar';
import { useAuthContext } from '@/auth/useAuthContext';
import { getRoleThemeColors, USER_ROLES } from '@/config/roles.config';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useMediaQuery } from '@/hooks';

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
  // Pull to refresh
  enablePullToRefresh?: boolean;
  onRefresh?: () => void | Promise<void>;
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
  headerBgClass,
  headerTextClass = "text-white",
  enablePullToRefresh = false,
  onRefresh,
}) => {
  // 사용자 역할 가져오기
  const { userRole } = useAuthContext();
  
  // 모바일 체크
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 기본 새로고침 함수
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      // 기본 동작: 페이지 새로고침
      window.location.reload();
    }
  };

  // 페이지 템플릿에 적용할 클래스 (CommonTemplate과 일관성 유지)
  const pageTemplateClass = `page-template-wrapper pt-0`;

  // 대시보드 컨텐츠 클래스 (CommonTemplate과 일관성 유지)
  const contentClasses = `template-content ${childrenClassName || "grid gap-4 lg:gap-5 pb-4"}`;

  // 그라데이션 클래스 생성 - 역할 기반 테마 사용
  let gradientClass;

  // 1. 헤더 배경색이 지정되지 않았으면 현재 사용자 역할 기반 테마 사용
  if (!headerBgClass && userRole) {
    // 사용자 역할에 따른 테마 그라디언트 사용
    gradientClass = getRoleThemeColors(userRole, 'gradient');
  }
  // 2. 직접 헤더 배경색이 지정된 경우
  else if (headerBgClass) {
    // 기존 컬러맵과의 호환성을 위한 색상 매핑
    const colorMap: Record<string, string> = {
      'bg-purple-600': getRoleThemeColors(USER_ROLES.DEVELOPER, 'gradient'),
      'bg-indigo-600': getRoleThemeColors(USER_ROLES.OPERATOR, 'gradient'),
      'bg-blue-600': getRoleThemeColors(USER_ROLES.ADVERTISER, 'gradient'),
      'bg-amber-600': getRoleThemeColors(USER_ROLES.DISTRIBUTOR, 'gradient')
    };

    // 매핑된 색상이 있으면 해당 색상 사용
    if (colorMap[headerBgClass]) {
      gradientClass = colorMap[headerBgClass];
    }
    // 일반 Tailwind 색상인 경우 자동 그라디언트 생성
    else {
      // 색상 클래스에서 'bg-' 접두사 제거
      const colorClass = headerBgClass.replace(/^bg-/, '');

      // 색상 이름과 강도 추출 (예: 'blue-600' -> 'blue', '600')
      const baseColorMatch = colorClass.match(/^(\w+(?:-\w+)?)-(\d+)$/);

      if (baseColorMatch && baseColorMatch[1]) {
        const baseColor = baseColorMatch[1]; // 색상 이름 (예: 'blue')
        const intensity = parseInt(baseColorMatch[2]); // 강도 (예: 600)

        // 시작 색상은 약간 밝게, 끝 색상은 약간 어둡게 설정
        const fromIntensity = Math.max(intensity - 100, 100);
        const toIntensity = Math.min(intensity + 100, 900);

        // 색상 이름에 따라 다른 대비 색상 사용
        let toColor = baseColor;

        // 특별한 색상 조합 (더 자연스러운 대비)
        if (baseColor === 'blue') toColor = 'indigo';
        else if (baseColor === 'indigo') toColor = 'violet';
        else if (baseColor === 'purple') toColor = 'indigo';
        else if (baseColor === 'red') toColor = 'rose';
        else if (baseColor === 'amber') toColor = 'orange';
        else if (baseColor === 'yellow') toColor = 'amber';
        else if (baseColor === 'green') toColor = 'emerald';

        gradientClass = `bg-gradient-to-r from-${baseColor}-${fromIntensity} to-${toColor}-${toIntensity}`;
      } else {
        // 매칭되지 않는 경우 원래 배경색 사용
        gradientClass = headerBgClass;
      }
    }
  }
  // 3. 둘 다 지정되지 않은 경우 기본 테마 사용
  else {
    gradientClass = getRoleThemeColors(USER_ROLES.ADVERTISER, 'gradient');
  }

  const content = (
    <div className={pageTemplateClass}>
      {/* 헤더 영역 - 커스텀 배경색 */}
      <Container fullWidth={fullWidth} className={containerClassName}>
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
  
  // 모바일에서 Pull to refresh 활성화
  if (isMobile && enablePullToRefresh) {
    return (
      <div className="relative">
        <PullToRefresh onRefresh={handleRefresh} className="pull-to-refresh-enabled">
          {content}
        </PullToRefresh>
      </div>
    );
  }
  
  return content;
};

export default DashboardTemplate;