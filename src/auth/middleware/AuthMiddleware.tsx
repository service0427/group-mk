import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../useAuthContext';
import { ScreenLoader } from '@/components/loaders';
import * as authHelper from '../_helpers';

// 인증 없이 접근 가능한 경로 정의
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/error/404',
  '/error/500'
];

const AuthMiddleware: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { 
    auth, 
    currentUser, 
    verify, 
    loading,
    authVerified
  } = useAuthContext();
  
  const [initialCheck, setInitialCheck] = useState(true);
  const [deepChecking, setDeepChecking] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 현재 경로가 공개 경로인지 확인
  const isPublicPath = PUBLIC_PATHS.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );
  
  // 현재 인증 상태 계산
  const isAuthenticated = !!auth && !!currentUser;
  
  // 초기 빠른 확인 (로컬 스토리지/세션 스토리지만 확인)
  useEffect(() => {
    const quickCheck = () => {
      // 공개 경로는 검증 생략
      if (isPublicPath) {
        setInitialCheck(false);
        return;
      }
      
      // 로컬 스토리지나 세션 스토리지에서 간단히 확인
      const hasAuth = authHelper.getAuth();
      const hasCachedUser = sessionStorage.getItem('currentUser');
      
      if (!hasAuth && !hasCachedUser) {
        // 인증 정보가 전혀 없는 경우만 즉시 리다이렉션
        console.log('인증 정보 전혀 없음, 로그인 페이지로 이동');
        navigate('/auth/login', { 
          state: { from: location.pathname },
          replace: true 
        });
      }
      
      setInitialCheck(false);
    };
    
    // 다음 이벤트 루프로 밀어 초기 렌더링 완료 후 실행
    setTimeout(quickCheck, 0);
  }, [location.pathname, isPublicPath, navigate]);
  
  // 세부 인증 검증 (비동기)
  useEffect(() => {
    // 초기 확인이 끝난 후에만 실행하고, 공개 경로가 아니고, 인증 검증되지 않은 경우에만 실행
    if (!initialCheck && !isPublicPath && !authVerified && auth) {
      const verifyFullAuth = async () => {
        console.log('세부 인증 검증 시작...');
        setDeepChecking(true);
        
        // 사용자 정보가 없는 경우에만 검증 실행
        if (!currentUser) {
          await verify();
        }
        
        setDeepChecking(false);
      };
      
      verifyFullAuth();
    }
  }, [initialCheck, isPublicPath, auth, currentUser, verify, authVerified]);
  
  // 인증 상태에 따른 리다이렉션 결정
  useEffect(() => {
    // 초기 확인 및 세부 검증이 끝난 후에만 리다이렉션 결정
    if (!initialCheck && !deepChecking && !loading && !isPublicPath) {
      // 인증 상태가 완전히 확인된 후 auth는 있지만 currentUser가 없는 경우 (검증 실패)
      if (auth && !currentUser) {
        console.log('인증 검증 실패, 로그인 페이지로 이동');
        navigate('/auth/login', { 
          state: { from: location.pathname },
          replace: true 
        });
      }
    }
  }, [initialCheck, deepChecking, loading, auth, currentUser, location.pathname, isPublicPath, navigate]);
  
  // 인증된 상태에서 인증 페이지 접근 시 리다이렉션
  useEffect(() => {
    if (!initialCheck && !loading && isAuthenticated && location.pathname.startsWith('/auth')) {
      console.log('이미 인증됨, 대시보드로 이동');
      navigate('/', { replace: true });
    }
  }, [initialCheck, loading, isAuthenticated, location.pathname, navigate]);
  
  // 로딩 상태 계산
  const isLoading = initialCheck || deepChecking || (loading && !isPublicPath);
  
  // 인증 검증 중이거나 로딩 중이면 로딩 화면 표시 (더 부드러운 UX를 위한 컨테이너 추가)
  if (isLoading) {
    return (
      <div className="auth-verification-container">
        <ScreenLoader />
      </div>
    );
  }
  
  return <>{children}</>;
};

export default AuthMiddleware;