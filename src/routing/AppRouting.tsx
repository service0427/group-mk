import { ReactElement } from 'react';
import AuthMiddlewareV2 from '@/auth/middleware/AuthMiddlewareV2';
import { AppRoutingSetup } from '.';

/**
 * 앱 라우팅 컴포넌트
 * 인증 미들웨어를 통해 인증 상태를 중앙에서 관리합니다.
 */
const AppRouting = (): ReactElement => {
  return (
    <AuthMiddlewareV2>
      <AppRoutingSetup />
    </AuthMiddlewareV2>
  );
};

export { AppRouting };