import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from './useAuthContext';
import { USER_ROLES, PERMISSION_GROUPS, hasPermission } from '@/config/roles.config';

/**
 * 역할 기반 접근 제어를 위한 속성 인터페이스
 * @property {string[]} allowedRoles - 접근이 허용된 역할 목록
 * @property {number} minRoleLevel - 최소 필요 권한 레벨 (예: PERMISSION_GROUPS.ADMIN)
 */
interface RequireAuthProps {
  allowedRoles?: string[];
  minRoleLevel?: number;
}

/**
 * 역할 기반 접근 제어 컴포넌트
 *
 * 이 컴포넌트는 사용자의 역할에 따라 특정 라우트에 대한 접근을 제한합니다.
 * 기본 인증 검증은 미들웨어에서 이미 처리되므로, 이 컴포넌트는 역할 검증만 수행합니다.
 *
 * 사용 예시:
 * 1. 특정 역할 허용:
 * <Route element={<RequireAuth allowedRoles={[USER_ROLES.OPERATOR, USER_ROLES.DEVELOPER]} />}>
 *   <Route path="/admin/*" element={<AdminPages />} />
 * </Route>
 *
 * 2. 최소 권한 레벨 설정:
 * <Route element={<RequireAuth minRoleLevel={PERMISSION_GROUPS.ADMIN} />}>
 *   <Route path="/admin/*" element={<AdminPages />} />
 * </Route>
 *
 * @param {RequireAuthProps} props - 컴포넌트 속성
 * @returns React 컴포넌트
 */
const RequireAuth = ({ allowedRoles = [], minRoleLevel }: RequireAuthProps = {}) => {
  const { isAuthenticated, userRole } = useAuthContext();
  const location = useLocation();

  // 인증 상태는 미들웨어에서 이미 검증됨

  // 접근 권한 체크
  let hasAccess = true;

  // 1. 역할 기반 접근 제어: 허용된 역할 목록이 있는 경우
  if (allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(userRole);
  }

  // 2. 레벨 기반 접근 제어: 최소 권한 레벨이 지정된 경우
  if (hasAccess && minRoleLevel !== undefined) {
    hasAccess = hasPermission(userRole, minRoleLevel);
  }

  // 접근 거부 처리
  if (!hasAccess) {
    // 존재하지 않는 페이지처럼 보이도록 404 에러 페이지로 리다이렉션
    // 이전 상태 정보를 포함하지 않도록 최소한의 필요 정보만 전달
    return <Navigate to="/error/404" replace />;
  }
  
  // 인증 및 역할 검증을 통과한 경우 자식 라우트 렌더링
  return <Outlet />;
};

export { RequireAuth };
