import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../useAuthContext';
import { ScreenLoader } from '@/components/loaders';
import * as authHelper from '../_helpers';
import { useUI } from '@/providers/UIProvider';

// 인증 없이 접근 가능한 경로 정의
const PUBLIC_PATHS = [
  '/auth',     // /auth로 시작하는 모든 경로 (로그인, 회원가입, 비밀번호 찾기 등)
  '/error'     // /error로 시작하는 모든 경로 (404, 500 등)
];

const AuthMiddleware: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { 
    auth, 
    currentUser, 
    verify, 
    loading,
    authVerified
  } = useAuthContext();
  
  const { setScreenLoader } = useUI();
  const [initialCheck, setInitialCheck] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 현재 경로가 공개 경로인지 확인
  const path = location.pathname;
  const hashPath = location.hash.replace(/^#\/?/, '/');
  
  // 로그아웃 중인지 확인
  const isLoggingOut = 
    (typeof window !== 'undefined' && window.location.href.includes('force=true')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth_redirect') === 'login');
  
  // 공개 경로 확인 (로그아웃 중이면 항상 true)
  const isPublicPath = isLoggingOut || PUBLIC_PATHS.some(publicPath => 
    path === publicPath || 
    path.startsWith(publicPath) || 
    hashPath === publicPath || 
    hashPath.startsWith(publicPath)
  );
  
  // 현재 인증 상태
  const isAuthenticated = !!auth && !!currentUser;
  
  // 초기 인증 확인 (한 번만 실행)
  useEffect(() => {
    const checkAuth = async () => {
      // 공개 경로는 검증 생략
      if (isPublicPath) {
        setInitialCheck(false);
        return;
      }
      
      // 로컬 스토리지에서 인증 토큰 확인
      const hasAuth = authHelper.getAuth();
      
      // 인증 정보가 없으면 즉시 로그인 페이지로
      if (!hasAuth) {
        const isAlreadyNavigatingToLogin = 
          location.pathname === '/auth/login' || 
          location.hash.includes('auth/login');
          
        if (!isAlreadyNavigatingToLogin) {
          navigate('/auth/login', { 
            state: { from: location.pathname + location.hash },
            replace: true 
          });
        }
        setInitialCheck(false);
        return;
      }
      
      // 인증 정보가 있고 검증되지 않은 경우에만 verify 실행
      if (!authVerified && !currentUser) {
        await verify();
      }
      
      setInitialCheck(false);
    };
    
    checkAuth();
  }, []); // 의존성 배열을 비워 한 번만 실행
  
  // 인증된 상태에서 인증 페이지 접근 시 리다이렉션
  useEffect(() => {
    const isAuthPage = location.pathname.startsWith('/auth') || 
                       (location.hash && location.hash.includes('auth/'));
                       
    if (!initialCheck && !loading && isAuthenticated && isAuthPage) {
      navigate('/', { replace: true });
    }
  }, [initialCheck, loading, isAuthenticated, location.pathname, location.hash, navigate]);
  
  // 로딩 상태 계산
  const isLoading = initialCheck || (loading && !isPublicPath);
  
  // 로딩 상태가 변경될 때마다 스크린 로더 상태 업데이트
  useEffect(() => {
    setScreenLoader(isLoading);
    
    return () => {
      setScreenLoader(false);
    };
  }, [isLoading, setScreenLoader]);
  
  // 로딩 중이 아닐 때만 자식 컴포넌트 렌더링
  return <>{!isLoading && children}</>;
};

export default AuthMiddleware;