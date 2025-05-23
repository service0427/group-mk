import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/providers/AuthProvider';
import { SettingsProvider } from './SettingsProvider';
import { TranslationProvider } from './TranslationProvider';
import { UIProvider } from './UIProvider';
import { ToastProvider } from './ToastProvider';
import { DialogProvider } from './DialogProvider';
import { HelmetProvider } from 'react-helmet-async';
import { LogoutProvider } from '@/contexts/LogoutContext';

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
 * - LayoutProvider, LoadersProvider, MenusProvider가 UIProvider로 통합됨
 * - 메모이제이션을 통해 불필요한 리렌더링 방지
 * - 선택적 상태 구독을 위한 특화된 훅 제공
 */
const ProvidersWrapper = ({ children }: PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      <LogoutProvider>
        <AuthProvider>
          <SettingsProvider>
            <TranslationProvider>
              <UIProvider>
                <ToastProvider>
                  <DialogProvider>
                    <HelmetProvider>
                      {children}
                    </HelmetProvider>
                  </DialogProvider>
                </ToastProvider>
              </UIProvider>
            </TranslationProvider>
          </SettingsProvider>
        </AuthProvider>
      </LogoutProvider>
    </QueryClientProvider>
  );
};

export { ProvidersWrapper };
