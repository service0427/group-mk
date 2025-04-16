import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/loaders';
import { useEffect, useState, useRef } from 'react';
import { useSupabaseAuth } from './supabase/SupabaseAuthProvider';

// 인증 필요 라우트 보호 컴포넌트
const RequireAuth = () => {
  const location = useLocation();
  const { session, isLoading } = useSupabaseAuth();
  const [initialCheck, setInitialCheck] = useState(true);
  const isNavigatingRef = useRef(false);
  
  // 로깅 추가
  console.log('App routing path:', location.pathname, 'Auth state:', !!session, 'Loading:', isLoading);
  
  // 초기 체크 완료 후 상태 업데이트 (최대 500ms 후 강제 진행)
  useEffect(() => {
    if (!isLoading) {
      setInitialCheck(false);
    } else {
      // 안전장치: 최대 500ms 후 강제로 초기 체크 완료 처리
      const timer = setTimeout(() => {
        if (initialCheck) {
          console.warn('RequireAuth: 초기 체크 강제 완료 (500ms 타임아웃)');
          setInitialCheck(false);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, initialCheck]);

  // 로그아웃 감지 및 처리
  useEffect(() => {
    if (!session && !isLoading && !initialCheck && !isNavigatingRef.current) {
      // 세션이 없고, 로딩 중이 아니며, 초기 체크가 완료되었고, 아직 네비게이팅 중이 아니면
      isNavigatingRef.current = true;
      console.log('세션 없음, 로그인 페이지로 이동');
    }
  }, [session, isLoading, initialCheck]);

  // 짧은 시간만 로딩 표시 (최대 300ms)
  if (isLoading && initialCheck) {
    return <ScreenLoader />;
  }

  // 인증 상태에 따라 콘텐츠 또는 로그인 페이지로 리디렉션
  return session ? <Outlet /> : <Navigate to="/auth/login" state={{ from: location }} replace />;
};

export { RequireAuth };
