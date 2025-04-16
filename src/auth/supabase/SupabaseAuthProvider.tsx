import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// 타입 정의
interface SupabaseAuthContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  profile: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateProfile: (name?: string, role?: string) => Promise<{ error: any }>;
}

// 기본 컨텍스트 값
const defaultContextValue: SupabaseAuthContextProps = {
  session: null,
  user: null,
  isLoading: true,
  profile: null,
  signIn: async () => ({ error: new Error('Auth provider not initialized') }),
  signUp: async () => ({ error: new Error('Auth provider not initialized') }),
  signOut: async () => {},
  resetPassword: async () => ({ error: new Error('Auth provider not initialized') }),
  updatePassword: async () => ({ error: new Error('Auth provider not initialized') }),
  updateProfile: async () => ({ error: new Error('Auth provider not initialized') })
};

// 컨텍스트 생성
const SupabaseAuthContext = createContext<SupabaseAuthContextProps>(defaultContextValue);

// 커스텀 훅
export const useSupabaseAuth = () => useContext(SupabaseAuthContext);

// 프로바이더 컴포넌트
export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // 초기값을 false로 변경
  const [profile, setProfile] = useState<any | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const initializingRef = useRef<boolean>(true);
  const isAuthStateChangingRef = useRef<boolean>(false);

  // 로딩 상태 관리 함수
  const startLoading = () => {
    setIsLoading(true);
    // 기존 타임아웃 제거
    clearLoadingTimeout();
    
    // 새 타임아웃 설정 (3초 후 강제 해제)
    loadingTimeoutRef.current = window.setTimeout(() => {
      console.warn('로딩 타임아웃으로 인한 강제 해제');
      setIsLoading(false);
    }, 3000);
  };

  const stopLoading = () => {
    clearLoadingTimeout();
    setIsLoading(false);
  };

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  // 프로필 정보 로드 함수
  const loadProfile = async (userId: string | undefined): Promise<any> => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase.rpc('api_get_profile');
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      
      // 기본 프로필 생성
      const { data } = await supabase.auth.getUser();
      return {
        id: userId,
        email: data?.user?.email || '',
        name: data?.user?.email?.split('@')[0] || '',
        role: data?.user?.user_metadata?.role || 'user'
      };
    }
  };

  // 초기 세션 로드
  useEffect(() => {
    const initAuth = async () => {
      if (!initializingRef.current) return;
      
      try {
        // 세션 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('세션 있음, 사용자 정보 설정');
          setSession(session);
          setUser(session.user);
          
          try {
            const profileData = await loadProfile(session.user.id);
            if (profileData) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error('초기 프로필 로드 실패:', error);
          }
        }
      } catch (error) {
        console.error('초기 인증 로드 오류:', error);
      } finally {
        initializingRef.current = false;
        stopLoading(); // 초기화 후 로딩 상태 해제
      }
    };

    initAuth();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('인증 상태 변경:', event);
      
      // 중복 처리 방지
      if (isAuthStateChangingRef.current) {
        console.log('이미 인증 상태 변경 처리 중, 무시');
        return;
      }
      
      try {
        isAuthStateChangingRef.current = true;
        
        // 로딩 상태 활성화
        startLoading();
        
        if (event === 'SIGNED_OUT') {
          console.log('로그아웃 처리');
          setSession(null);
          setUser(null);
          setProfile(null);
          stopLoading();
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            console.log('새 세션 설정');
            setSession(newSession);
            setUser(newSession.user);
            
            try {
              console.log('프로필 정보 로드 시도');
              const profileData = await loadProfile(newSession.user.id);
              setProfile(profileData);
            } catch (profileError) {
              console.error('프로필 정보 로드 실패:', profileError);
            }
          }
        }
      } catch (error) {
        console.error('인증 상태 변경 처리 오류:', error);
      } finally {
        stopLoading();
        isAuthStateChangingRef.current = false;
        console.log('인증 상태 변경 처리 완료, 로딩 상태:', isLoading);
      }
    });

    // 클린업
    return () => {
      subscription.unsubscribe();
      clearLoadingTimeout();
    };
  }, []);

  // 로그인 메서드
  const signIn = async (email: string, password: string) => {
    startLoading();
    
    try {
      console.log('로그인 시도:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('로그인 오류:', error);
        stopLoading();
        return { error };
      }
      
      console.log('로그인 성공');
      // 로그인 성공 시 로딩 상태는 Auth 상태 변경 리스너에서 처리됨
      return { error: null };
    } catch (error) {
      console.error('로그인 예외:', error);
      stopLoading();
      return { error };
    }
  };

  // 회원가입 메서드
  const signUp = async (email: string, password: string, role: string = 'advertiser') => {
    startLoading();
    
    try {
      console.log('회원가입 시도:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role
          }
        }
      });
      
      if (error) {
        console.error('회원가입 오류:', error);
        stopLoading();
        return { error };
      }
      
      console.log('회원가입 성공, 사용자 데이터 생성 시도');
      
      try {
        if (data.user) {
          const { error: rpcError } = await supabase.rpc('api_create_user_data', {
            p_user_id: data.user.id,
            p_email: email,
            p_role: role
          });
          
          if (rpcError) {
            console.warn('사용자 데이터 생성 실패:', rpcError);
          }
        }
      } catch (rpcError) {
        console.warn('RPC 호출 오류:', rpcError);
      }
      
      // Auth 상태 변경 리스너에서 로딩 상태 처리
      return { error: null };
    } catch (error) {
      console.error('회원가입 예외:', error);
      stopLoading();
      return { error };
    }
  };

  // 로그아웃 메서드
  const signOut = async () => {
    startLoading();
    
    try {
      console.log('로그아웃 시도');
      
      // 먼저 상태 초기화
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // 로컬 스토리지 정리
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('supabase.') || 
            key.includes('token') || 
            key.includes('auth')) {
          localStorage.removeItem(key);
        }
      }
      
      // 서버 로그아웃 (3초 타임아웃)
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 3000))
      ]);
      
      stopLoading();
      
      // 로그인 페이지로 이동
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      stopLoading();
      
      // 로그인 페이지로 이동
      window.location.href = '/auth/login';
    }
  };

  // 비밀번호 재설정 메서드
  const resetPassword = async (email: string) => {
    startLoading();
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password/change'
      });
      
      stopLoading();
      return { error };
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      stopLoading();
      return { error };
    }
  };

  // 비밀번호 업데이트 메서드
  const updatePassword = async (password: string) => {
    startLoading();
    
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      stopLoading();
      return { error };
    } catch (error) {
      console.error('비밀번호 업데이트 오류:', error);
      stopLoading();
      return { error };
    }
  };
  
  // 프로필 업데이트 메서드
  const updateProfile = async (name?: string, role?: string) => {
    startLoading();
    
    try {
      const { error } = await supabase.rpc('api_update_profile', {
        p_name: name,
        p_role: role
      });
      
      if (!error) {
        try {
          const profileData = await loadProfile(user?.id);
          if (profileData) {
            setProfile(profileData);
          }
        } catch (profileError) {
          console.error('업데이트 후 프로필 로드 실패:', profileError);
        }
      }
      
      stopLoading();
      return { error };
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      stopLoading();
      return { error };
    }
  };

  // 디버깅용 상태 로깅
  useEffect(() => {
    console.log(`상태 변경: {isLoading: ${isLoading}, hasUser: ${!!user}, hasSession: ${!!session}, hasProfile: ${!!profile}}`);
  }, [isLoading, user, session, profile]);

  const value = {
    session,
    user,
    isLoading,
    profile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};

export default SupabaseAuthProvider;
