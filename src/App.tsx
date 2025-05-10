import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom'; // BrowserRouter에서 HashRouter로 변경
import { useSettings } from '@/providers/SettingsProvider';
import { AppRouting } from '@/routing';
import { PathnameProvider } from '@/providers';
import { Toaster } from '@/components/ui/sonner';
import { ScrollToTop } from '@/components';

const App = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add(settings.themeMode);
  }, [settings]);

  // 로그아웃 후 페이지 새로고침 시 로그인 페이지로 리다이렉트 확인
  useEffect(() => {
    const checkLogoutRedirect = () => {
      const shouldRedirect = sessionStorage.getItem('logout_redirect');
      const logoutTimestamp = sessionStorage.getItem('logout_timestamp');
      
      if (shouldRedirect === 'true') {
        // 로그아웃 리디렉션 플래그 제거
        sessionStorage.removeItem('logout_redirect');
        sessionStorage.removeItem('logout_timestamp');
        
        // 현재 경로가 이미 로그인 페이지가 아닌 경우에만 리디렉트
        if (!window.location.hash.includes('/auth/login')) {
          console.log('로그아웃 후 리디렉션: 로그인 페이지로 이동합니다.');
          window.location.href = '/#/auth/login';
        }
      }
    };
    
    // 초기 로드 시 한 번 확인
    checkLogoutRedirect();
  }, []);

  // HashRouter는 URL에 # 기호를 사용하여 클라이언트 측 라우팅을 처리합니다.
  // 예: example.com/#/dashboard 형식
  // 이 방식은 서버에 실제 요청을 보내지 않으므로 새로고침 문제를 완전히 해결합니다.
  return (
    <HashRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <PathnameProvider>
        <ScrollToTop />
        <AppRouting />
      </PathnameProvider>
      <Toaster />
    </HashRouter>
  );
};

export { App };
