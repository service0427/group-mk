import { Outlet } from 'react-router-dom';
import { AuthLayoutProvider } from './AuthLayoutProvider';
import { toAbsoluteUrl } from '@/utils';
import useBodyClasses from '@/hooks/useBodyClasses';
import { Fragment, useEffect } from 'react';
import { useLogoutContext } from '@/contexts/LogoutContext';

const Layout = () => {
  // Applying body classes to set the background color in dark mode
  useBodyClasses('dark:bg-coal-500');
  
  const { isLoggingOut, setIsLoggingOut } = useLogoutContext();
  
  // 마운트 시 auth-page 클래스 추가, 언마운트 시 제거
  useEffect(() => {
    // 인증 페이지임을 표시하기 위한 클래스 추가
    document.body.classList.add('auth-page');
    
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);
  
  // Check URL parameters for login transitions and clear logout state if needed
  useEffect(() => {
    // 로그인 페이지에 도착하면 로그아웃 상태 초기화
    if (isLoggingOut) {
      // Set a brief timeout to ensure the page has loaded before clearing state
      const timer = setTimeout(() => {
        setIsLoggingOut(false);
        localStorage.removeItem('auth_redirect');
        localStorage.removeItem('logout_timestamp');
      }, 100); // 더 빠르게 상태 초기화
      
      return () => clearTimeout(timer);
    }
  }, [isLoggingOut, setIsLoggingOut]);

  return (
    <Fragment>
      <style>
        {`
          .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
          }
          .dark .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
          }
        `}
      </style>
      <div className={`flex items-center justify-center grow bg-center bg-no-repeat page-bg auth-layout ${isLoggingOut ? 'no-transition' : ''}`}>
        <Outlet />
      </div>
    </Fragment>
  );
};

const AuthLayout = () => (
  <AuthLayoutProvider>
    <Layout />
  </AuthLayoutProvider>
);

export { AuthLayout };
