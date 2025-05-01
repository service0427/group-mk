import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from './useAuthContext';

/**
 * 역할 기반 접근 제어를 위한 속성 인터페이스
 * @property {string[]} allowedRoles - 접근이 허용된 역할 목록
 */
interface RequireAuthProps {
  allowedRoles?: string[];
}

/**
 * 역할 기반 접근 제어 컴포넌트
 * 
 * 이 컴포넌트는 사용자의 역할에 따라 특정 라우트에 대한 접근을 제한합니다.
 * 기본 인증 검증은 미들웨어에서 이미 처리되므로, 이 컴포넌트는 역할 검증만 수행합니다.
 * 
 * 사용 예시:
 * <Route element={<RequireAuth allowedRoles={['admin', 'operator']} />}>
 *   <Route path="/admin/*" element={<AdminPages />} />
 * </Route>
 * 
 * @param {RequireAuthProps} props - 컴포넌트 속성
 * @returns React 컴포넌트
 */
const RequireAuth = ({ allowedRoles = [] }: RequireAuthProps = {}) => {
  const { isAuthenticated, userRole } = useAuthContext();
  const location = useLocation();
  
  // 인증 상태는 미들웨어에서 이미 검증됨
  
  // 역할 기반 접근 제어: 허용된 역할 목록이 있고, 현재 사용자의 역할이 그 목록에 없는 경우
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(`접근 거부: 사용자 역할(${userRole})은 이 페이지에 접근할 수 없음`);
    
    // 403(권한 없음) 에러 페이지로 리다이렉션
    return <Navigate to="/error/403" state={{ from: location }} replace />;
  }
  
  // 인증 및 역할 검증을 통과한 경우 자식 라우트 렌더링
  return <Outlet />;
};

export { RequireAuth };
