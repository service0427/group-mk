import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../useAuthContext';
import { ScreenLoader } from '@/components/loaders';
import { SafeHashNavigation } from '@/utils/safeHashNavigation';
import { useLogoutContext } from '@/contexts/LogoutContext';
import { useUI } from '@/providers/UIProvider';
import * as authHelper from '../_helpers';

// 인증 없이 접근 가능한 경로 정의
const PUBLIC_PATHS = [
  '/auth',     // /auth로 시작하는 모든 경로 (로그인, 회원가입, 비밀번호 찾기 등)
  '/error'     // /error로 시작하는 모든 경로 (404, 500 등)
];

/**
 * 개선된 AuthMiddleware
 * SafeHashNavigation을 사용하여 안전한 리다이렉션 처리
 */
const AuthMiddlewareV2: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { 
    auth, 
    currentUser, 
    verify, 
    loading,
    authVerified
  } = useAuthContext();
  
  const { setScreenLoader } = useUI();
  const { isLoggingOut, safeApiCall } = useLogoutContext();
  const [initialCheck, setInitialCheck] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 현재 경로가 공개 경로인지 확인
  const isPublicPath = PUBLIC_PATHS.some(publicPath => {
    const currentPath = SafeHashNavigation.getCurrentHashPath();
    return currentPath.startsWith(publicPath);
  });
  
  // 현재 인증 상태
  const isAuthenticated = !!auth && !!currentUser;
  
  // 초기 인증 확인 (한 번만 실행)
  useEffect(() => {
    const checkAuth = async () => {
      // 로그아웃 중이면 검증 생략
      if (isLoggingOut) {
        // 로그아웃 중, 인증 체크 건너뜀
        setInitialCheck(false);
        return;
      }
      
      // 공개 경로는 검증 생략
      if (isPublicPath) {
        setInitialCheck(false);
        return;
      }
      
      // 로컬 스토리지에서 인증 토큰 확인
      const hasAuth = authHelper.getAuth();
      
      // 인증 정보가 없으면 즉시 로그인 페이지로
      if (!hasAuth) {
        // 인증 정보 없음, 로그인 페이지로 이동
        await SafeHashNavigation.navigateToLogin(navigate, {
          forceHardRedirect: false
        });
        setInitialCheck(false);
        return;
      }
      
      // 인증 정보가 있고 검증되지 않은 경우에만 verify 실행
      if (!authVerified && !currentUser) {
        await safeApiCall(verify, undefined);
      }
      
      setInitialCheck(false);
    };
    
    checkAuth();
  }, []); // 의존성 배열을 비워 한 번만 실행
  
  // 인증된 상태에서 인증 페이지 접근 시 리다이렉션
  useEffect(() => {
    const currentPath = SafeHashNavigation.getCurrentHashPath();
    const isAuthPage = currentPath.startsWith('/auth');
    
    // 비밀번호 재설정 관련 페이지는 인증된 사용자도 접근 가능
    const isPasswordResetPath = currentPath.includes('/reset-password');
    
    if (!initialCheck && !loading && isAuthenticated && isAuthPage && !isPasswordResetPath && !isLoggingOut) {
      // 인증된 사용자가 인증 페이지 접근, 홈으로 리다이렉션 (비밀번호 재설정 페이지 제외)
      navigate('/', { replace: true });
    }
  }, [initialCheck, loading, isAuthenticated, navigate, isLoggingOut]);
  
  // 인증 상태 변경 감지 및 리다이렉션
  useEffect(() => {
    if (!initialCheck && !loading && authVerified && !isLoggingOut) {
      const needsAuth = !isPublicPath && !isAuthenticated;
      
      if (needsAuth) {
        // 인증 필요, 로그인 페이지로 이동
        SafeHashNavigation.navigateToLogin(navigate, {
          forceHardRedirect: false
        });
      }
    }
  }, [initialCheck, loading, authVerified, isPublicPath, isAuthenticated, navigate, isLoggingOut]);
  
  // 로딩 상태 계산
  const isLoading = initialCheck || (loading && !isPublicPath) || (isLoggingOut && !isPublicPath);
  
  // 로딩 상태가 변경될 때마다 스크린 로더 상태 업데이트
  useEffect(() => {
    // 로그아웃 중이면 스크린 로더 표시하지 않음 (LogoutTransition이 처리)
    if (!isLoggingOut) {
      setScreenLoader(isLoading);
    }
    
    return () => {
      setScreenLoader(false);
    };
  }, [isLoading, setScreenLoader, isLoggingOut]);
  
  // 로그아웃 중이면 현재 화면 유지
  if (isLoggingOut) {
    return <>{children}</>;
  }
  
  // 로딩 중이면 스크린 로더 표시
  if (isLoading) {
    return <ScreenLoader />;
  }
  
  // 로딩이 끝났으면 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default AuthMiddlewareV2;