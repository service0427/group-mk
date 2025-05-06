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
      
      // 로컬 스토리지에서 인증 토큰 확인
      const hasAuth = authHelper.getAuth();
      // 세션 스토리지에서 사용자 정보 확인
      const cachedUserStr = sessionStorage.getItem('currentUser');
      let hasCachedUser = false;
      
      // 캐시된 사용자 데이터가 유효한지 확인
      if (cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          // 최소한의 유효성 검사
          hasCachedUser = !!(cachedUser && cachedUser.id && cachedUser.email);
        } catch (e) {
          console.warn('세션 스토리지 사용자 데이터 파싱 오류:', e);
          // 손상된 데이터 제거
          sessionStorage.removeItem('currentUser');
        }
      }
      
      // 인증 정보가 일치하지 않는 경우 (토큰은 있지만 사용자 정보 없음 등) 세션 정리
      if ((hasAuth && !hasCachedUser) || (!hasAuth && hasCachedUser)) {
        console.warn('인증 상태 불일치 감지, 세션 정리');
        // 모든 인증 관련 데이터 정리
        authHelper.removeAuth();
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('lastAuthCheck');
        
        // 인증 관련 항목 제거
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      // 인증 정보가 전혀 없는 경우 로그인 페이지로 이동
      if (!hasAuth && !hasCachedUser) {
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
      // 이미 로그인 페이지로 가고 있는 상태인지 확인
      const isAlreadyNavigatingToLogin = location.pathname === '/auth/login';
      
      // 인증 상태가 완전히 확인된 후 auth는 있지만 currentUser가 없는 경우 (검증 실패)
      if (auth && !currentUser && !isAlreadyNavigatingToLogin) {
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
      navigate('/', { replace: true });
    }
  }, [initialCheck, loading, isAuthenticated, location.pathname, navigate]);
  
  // 로딩 상태 계산 및 스크린 로더 제어
  const isLoading = initialCheck || deepChecking || (loading && !isPublicPath);
  
  // 로딩 상태가 변경될 때마다 스크린 로더 상태 업데이트
  useEffect(() => {
    setScreenLoader(isLoading);
    
    // 컴포넌트 언마운트 시 스크린 로더 비활성화
    return () => {
      setScreenLoader(false);
    };
  }, [isLoading, setScreenLoader]);
  
  // 로딩 중이 아닐 때만 자식 컴포넌트 렌더링
  return <>{!isLoading && children}</>;
};

export default AuthMiddleware;