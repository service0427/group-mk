import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ScreenLoader } from '@/components/loaders';
import { useEffect, useState } from 'react';
import { supabase } from './supabase/supabaseClient';

// 간소화된 인증 필요 라우트 보호 컴포넌트
const RequireAuth = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        // Supabase 세션 직접 확인
        const { data } = await supabase.auth.getSession();
        
        const hasSession = !!data.session;
        console.log('Session check result:', { hasSession });
        
        setIsAuthenticated(hasSession);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return <ScreenLoader />;
  }

  // 인증 상태에 따라 콘텐츠 또는 로그인 페이지로 리디렉션
  if (isAuthenticated) {
    return <Outlet />;
  } else {
    // 로컬 스토리지 정리
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('supabase.') || key.includes('token') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    }
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
};

export { RequireAuth };
