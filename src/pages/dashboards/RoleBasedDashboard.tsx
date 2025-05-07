import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/useAuthContext';

/**
 * 사용자 역할 기반 대시보드 리다이렉션 컴포넌트
 * 사용자의 역할에 따라 적절한 대시보드 페이지로 리다이렉션합니다.
 */
const RoleBasedDashboard: React.FC = () => {
  const { userRole, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      return; // RequireAuth에서 처리할 것이므로 여기서는 무시
    }

    // 역할에 따른 리다이렉션
    switch (userRole) {
      case 'developer':
        navigate('/dashboard/developer', { replace: true });
        break;
      case 'operator':
        navigate('/dashboard/operator', { replace: true });
        break;
      case 'distributor':
        navigate('/dashboard/distributor', { replace: true });
        break;
      case 'agency':
        navigate('/dashboard/agency', { replace: true });
        break;
      case 'advertiser':
        navigate('/dashboard/advertiser', { replace: true });
        break;
      default:
        // 기본 대시보드 또는 역할이 없는 경우 처리
        console.warn(`Unknown role: ${userRole}, redirecting to default dashboard`);
        // 기본 대시보드 페이지로 리다이렉션
        navigate('/dashboard/default', { replace: true });
        break;
    }
  }, [userRole, isAuthenticated, navigate]);

  // 리다이렉션 중에는 로딩 상태 표시
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export { RoleBasedDashboard };