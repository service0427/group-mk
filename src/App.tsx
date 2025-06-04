import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom'; // BrowserRouter에서 HashRouter로 변경
import { useSettings } from '@/providers/SettingsProvider';
import { AppRouting } from '@/routing';
import { PathnameProvider } from '@/providers';
import { ScrollToTop } from '@/components';
import { LogoutTransition } from '@/components/loaders';
import { useLogoutContext } from '@/contexts/LogoutContext';
import { AuthProviderV2 } from '@/auth/providers/AuthProviderV2';

const App = () => {
  const { settings } = useSettings();
  const { isLoggingOut } = useLogoutContext();

  useEffect(() => {
    // 다크모드 전환 시 transitioning 클래스 추가
    document.documentElement.classList.add('transitioning');
    
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add(settings.themeMode);
    
    // 트랜지션 완료 후 transitioning 클래스 제거
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
    }, 300);
    
    return () => clearTimeout(timer);
  }, [settings]);

  // 세션/로컬 스토리지 플래그 정리 전용 (리디렉션 제거)
  useEffect(() => {
    // 플래그 정리 전용 함수
    const cleanupFlags = () => {
      try {
        // 모든 관련 로그아웃 플래그 제거
        sessionStorage.removeItem('direct_to_login');
        sessionStorage.removeItem('logout_complete');
        sessionStorage.removeItem('logout_redirect');
        sessionStorage.removeItem('logout_timestamp');
        sessionStorage.removeItem('logout_error');
      } catch (_) {
        // 무시
      }
    };

    // 이미 로그인 페이지에 있는지 확인
    const isLoginPage = window.location.hash.includes('/auth/login');

    // 이미 로그인 페이지에 있다면 플래그만 정리
    if (isLoginPage) {
      cleanupFlags();
      return;
    }

    // 로그인 페이지가 아닌 경우에만 리디렉트 필요한지 확인
    // 중요: 이 플래그가 설정되어 있다면 이미 다른 곳에서 리디렉션 중일 수 있음
    const maybeRedirecting = sessionStorage.getItem('logout_redirect') === 'true' ||
      sessionStorage.getItem('direct_to_login') === 'true';

    // 플래그가 있으면 정리만 하고 리디렉션은 skip
    if (maybeRedirecting) {
      cleanupFlags();
      // 리디렉션 제거: window.location.hash = '#/auth/login';
    }
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
      {/* 가장 먼저 로그아웃 전환 컴포넌트 렌더링 - 최상위 우선순위 */}
      <LogoutTransition />

      <AuthProviderV2>
        <PathnameProvider>
          <ScrollToTop />

          {/* 라우팅 구조 */}
          <Routes>
            <Route path="/*" element={<AppRouting />} />
          </Routes>
        </PathnameProvider>
      </AuthProviderV2>
    </HashRouter>
  );
};

export { App };
