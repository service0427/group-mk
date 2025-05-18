import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/auth/useAuthContext';
import { USER_ROLES } from '@/config/roles.config';

// 각 역할별 대시보드 컴포넌트 임포트
import { DeveloperDashboardContent } from './developer';
import { OperatorDashboardContent } from './operator';
import { DistributorDashboardContent } from './distributor';
import { AgencyDashboardContent } from './agency';
import { AdvertiserDashboardContent } from './advertiser';
import { BeginnerDashboardContent } from './beginner';

/**
 * 사용자 역할 기반 대시보드 컴포넌트
 * 사용자의 역할에 따라 적절한 대시보드 컨텐츠를 렌더링합니다.
 * URL은 '/'로 유지됩니다.
 */
const RoleBasedDashboard: React.FC = () => {
  const { userRole, isAuthenticated } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      return; // RequireAuth에서 처리할 것이므로 여기서는 무시
    }

    // 로딩 상태 종료 - 각 역할별 대시보드 컨텐츠를 렌더링할 준비
    setIsLoading(false);
  }, [userRole, isAuthenticated]);

  // 로딩 중일 때는 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">대시보드 불러오는 중...</div>
        </div>
      </div>
    );
  }

  console.log(userRole);

  // 역할에 따른 대시보드 콘텐츠 렌더링
  switch (userRole) {
    case USER_ROLES.DEVELOPER:
      return <DeveloperDashboardContent />;
    case USER_ROLES.OPERATOR:
      return <OperatorDashboardContent />;
    case USER_ROLES.DISTRIBUTOR:
      return <DistributorDashboardContent />;
    case USER_ROLES.AGENCY:
      return <AgencyDashboardContent />;
    case USER_ROLES.ADVERTISER:
      return <AdvertiserDashboardContent />;
    case USER_ROLES.BEGINNER:
      return <BeginnerDashboardContent />;
    default:
      // 기본값도 advertiser로 변경
      return <AdvertiserDashboardContent />;
  }
};

export { RoleBasedDashboard };