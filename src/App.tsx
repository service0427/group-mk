import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSettings } from '@/providers/SettingsProvider';
import { AppRouting } from '@/routing';
import { PathnameProvider } from '@/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/auth/useAuthContext';
import SupabaseAuthProvider from '@/auth/supabase/SupabaseAuthProvider';

const { BASE_URL } = import.meta.env;

const App = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add(settings.themeMode);
  }, [settings]);

  return (
    <BrowserRouter
      basename={BASE_URL}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <SupabaseAuthProvider>
        <AuthProvider>
          <PathnameProvider>
            <AppRouting />
          </PathnameProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
      <Toaster />
    </BrowserRouter>
  );
};

export { App };
