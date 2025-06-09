import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider } from './SettingsProvider';
import { TranslationProvider } from './TranslationProvider';
import { UIProvider } from './UIProvider';
import { HelmetProvider } from 'react-helmet-async';
import { LogoutProvider } from '@/contexts/LogoutContext';
import { AlertProvider } from '@/hooks/useAlert';
import { DialogProvider } from '@/components/dialogs/AlertConfirmDialogs';

// 단일 QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

/**
 * 프로바이더 래퍼 컴포넌트
 * 
 * 여러 Provider를 단순화하여 중첩 깊이를 줄이고 성능을 개선했습니다.
 * - LayoutProvider, LoadersProvider, MenusProvider, ToastProvider, DialogProvider가 UIProvider로 통합됨
 * - Context 분할 패턴을 통해 선택적 구독 가능
 * - 메모이제이션을 통해 불필요한 리렌더링 방지
 * - AuthProvider는 Router 내부에서 초기화되도록 변경됨
 */
const ProvidersWrapper = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <SettingsProvider>
          <TranslationProvider>
            <LogoutProvider>
              <AlertProvider>
                <UIProvider>
                  <DialogProvider>
                    {children}
                  </DialogProvider>
                </UIProvider>
              </AlertProvider>
            </LogoutProvider>
          </TranslationProvider>
        </SettingsProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export { ProvidersWrapper };
