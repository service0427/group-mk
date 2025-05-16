import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom'; // BrowserRouter에서 HashRouter로 변경
import { useSettings } from '@/providers/SettingsProvider';
import { AppRouting } from '@/routing';
import { PathnameProvider } from '@/providers';
import { ScrollToTop } from '@/components';
import { LogoutTransition } from '@/components/loaders';
import { useLogoutContext } from '@/contexts/LogoutContext';

const App = () => {
  const { settings } = useSettings();
  const { isLoggingOut } = useLogoutContext();

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
          // 브라우저 내비게이션 히스토리를 리셋하고 로그인 페이지로 이동
          window.location.replace(window.location.origin);
          
          // 짧은 지연 후 실행 (브라우저가 첫 번째 replace를 처리할 시간을 줌)
          setTimeout(() => {
            // HashRouter와 함께 사용하기 위한 올바른 URL 형식
            window.location.hash = '/auth/login';
          }, 50);
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
        {/* 로그아웃 전환 컴포넌트 - 화면 깜박임 방지 */}
        <LogoutTransition />
        <AppRouting />
      </PathnameProvider>
    </HashRouter>
  );
};

export { App };
