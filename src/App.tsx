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
