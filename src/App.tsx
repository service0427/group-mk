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
      // 강화된 로그아웃 완료 감지
      const directToLogin = sessionStorage.getItem('direct_to_login');
      const logoutComplete = sessionStorage.getItem('logout_complete');
      const logoutError = sessionStorage.getItem('logout_error');
      
      // 직접 로그인 페이지로 이동해야 하는 경우
      if (directToLogin === 'true' && logoutComplete === 'true') {
        // 모든 플래그 제거
        sessionStorage.removeItem('direct_to_login');
        sessionStorage.removeItem('logout_complete');
        sessionStorage.removeItem('logout_error');
        
        // 이미 로그인 페이지에 있지 않은 경우에만 리디렉트
        if (!window.location.hash.includes('/auth/login')) {
          
          // 해시가 이미 설정되어 있는지 확인
          if (!window.location.hash || window.location.hash === '#') {
            // 해시 라우터가 인식할 수 있는 형식으로 설정
            window.location.hash = '#/auth/login';
            
            // 로그아웃 오류가 있었다면 오류 파라미터 추가
            if (logoutError === 'true') {
              setTimeout(() => {
                window.location.hash = '#/auth/login?error=1';
              }, 10);
            }
          }
        }
      }
      
      // 레거시 지원 - 이전 로그아웃 방식과의 호환성 유지
      const shouldRedirect = sessionStorage.getItem('logout_redirect');
      const logoutTimestamp = sessionStorage.getItem('logout_timestamp');
      
      if (shouldRedirect === 'true') {
        // 레거시 플래그 제거
        sessionStorage.removeItem('logout_redirect');
        sessionStorage.removeItem('logout_timestamp');
        
        // 현재 경로가 이미 로그인 페이지가 아닌 경우에만 리디렉트
        if (!window.location.hash.includes('/auth/login')) {
          
          // 해시 라우터가 인식할 수 있는 형식으로 설정
          window.location.hash = '#/auth/login';
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
