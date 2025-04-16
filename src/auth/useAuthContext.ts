import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase/supabaseClient';

interface AuthContextData {
  isLoading: boolean;
  isAuthorized: boolean;
  session: Session | null;
  hasProfile: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({
  isLoading: true,
  isAuthorized: false,
  session: null,
  hasProfile: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {}
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      setSession(session);
      setIsAuthorized(!!session);
      
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();
        setHasProfile(!!data);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthorized(false);
      setSession(null);
      setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      await checkAuth();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: string = 'advertiser') => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }
        }
      });
      
      if (error) throw error;
      
      await checkAuth();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('로그아웃 시작');
      
      // 먼저 상태 초기화 (UI 응답성 확보)
      setIsAuthorized(false);
      setSession(null);
      setHasProfile(false);
      
      // 로컬 스토리지 정리
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.') || 
            key.includes('token') || 
            key.includes('auth')) {
          localStorage.removeItem(key);
        }
      }
      
      // 쿠키 제거
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      
      // Supabase 서버 로그아웃
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('로그아웃 성공, 로그인 페이지로 이동');
      
      // 로그인 페이지로 리디렉션 추가
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // 오류 발생해도 로그인 페이지로 이동
      window.location.href = '/auth/login';
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변경:', event);
      
      setSession(session);
      setIsAuthorized(!!session);
      
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();
        setHasProfile(!!data);
        
        // 로그인 상태가 되면 현재 경로가 인증 관련 경로인 경우 루트 경로(/)로 리디렉션
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/auth/')) {
          console.log('인증됨, 루트 경로(/)로 리디렉션');
          window.location.href = '/';
        }
      } else if (event === 'SIGNED_OUT') {
        // 로그아웃 이벤트 감지 시 추가 처리
        setIsAuthorized(false);
        setSession(null);
        setHasProfile(false);
        
        // 로그아웃 시 비인증 접근 불가 경로에 있으면 로그인 페이지로 리디렉션
        const currentPath = window.location.pathname;
        if (currentPath !== '/auth/login' && currentPath !== '/auth/signup') {
          console.log('로그아웃됨, 로그인 페이지로 리디렉션');
          window.location.href = '/auth/login';
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const contextValue: AuthContextData = {
    isLoading,
    isAuthorized,
    session,
    hasProfile,
    login,
    register,
    logout,
    checkAuth
  };

  // React.createElement를 사용하여 JSX 없이 Provider 생성
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};