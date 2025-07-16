import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/supabase';
import { CustomUser, AuthModel } from '@/auth/_models';
import { LogoutService } from '@/services/auth/LogoutService';
import * as authHelper from '@/auth/_helpers';
import { NavigateFunction } from 'react-router-dom';
import { USER_ROLES } from '@/config/roles.config';

/**
 * 인증 에러 타입
 */
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * 인증 상태 인터페이스
 */
export interface AuthState {
  // 상태
  auth: AuthModel | undefined;
  currentUser: CustomUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  authVerified: boolean;
  error: AuthError | null;
  
  // 액션
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, full_name: string, password: string, password_confirmation: string) => Promise<any>;
  logout: (navigate?: NavigateFunction) => Promise<boolean>;
  verify: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  refreshUserRole: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  requestPasswordResetLink: (email: string) => Promise<void>;
  changePassword: (email: string, token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  
  // 사용자 전환 기능
  impersonateUser: (targetUserId: string, reason?: string) => Promise<boolean>;
  stopImpersonation: () => Promise<boolean>;
  getActiveImpersonation: () => Promise<any>;
  originalAuth?: AuthModel;
  originalUser?: CustomUser;
  isImpersonating: boolean;
  
  // 헬퍼 메서드
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  protectedApiCall: <T>(apiCall: () => Promise<T>) => Promise<T | null>;
}

/**
 * Zustand를 사용한 통합 인증 스토어
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        auth: authHelper.getAuth(),
        currentUser: null,
        isAuthenticated: false,
        isLoading: true,
        isLoggingOut: false,
        authVerified: false,
        error: null,
        isImpersonating: false,
        originalAuth: undefined,
        originalUser: undefined,
        
        // 로그인
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // Supabase 로그인
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (error) {
              throw error;
            }
            
            if (!data.user || !data.session) {
              throw new Error('로그인 응답이 올바르지 않습니다');
            }
            
            // 인증 정보 저장
            const authData: AuthModel = {
              api_token: data.session.access_token,
              access_token: data.session.access_token,
              refreshToken: data.session.refresh_token
            };
            
            authHelper.setAuth(authData);
            
            // 메타데이터에서 역할 확인
            const metadataRole = data.user.user_metadata?.role;
            let customUser: CustomUser;
            
            // Beginner 역할인 경우 DB 조회 없이 바로 처리
            if (metadataRole === USER_ROLES.BEGINNER) {
              customUser = {
                id: data.user.id,
                email: data.user.email || '',
                full_name: data.user.user_metadata?.full_name || '',
                phone_number: '',
                role: USER_ROLES.BEGINNER,
                status: 'active',
                raw_user_meta_data: data.user.user_metadata
              };
            } else {
              // 비기너가 아닌 경우에만 users 테이블 조회
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
              
              if (userError) {
                // 사용자 정보 조회 실패
                // 사용자 정보 조회 실패해도 로그인은 성공 처리
              }
              
              customUser = {
                ...data.user,
                ...(userData || {}),
                role: userData?.role || data.user.user_metadata?.role || 'beginner'
              } as CustomUser;
            }
            
            set({
              auth: authData,
              currentUser: customUser,
              isAuthenticated: true,
              isLoading: false,
              authVerified: true,
              error: null
            });
            
            // 로그인 성공
            return true;
            
          } catch (error: any) {
            // 로그인 실패
            
            // 인증 정보 완전 제거
            authHelper.removeAuth();
            
            set({
              auth: undefined,
              currentUser: null,
              isAuthenticated: false,
              authVerified: false,
              error: {
                code: error.code || 'LOGIN_ERROR',
                message: error.message || '로그인 중 오류가 발생했습니다',
                details: error
              },
              isLoading: false
            });
            
            return false;
          }
        },
        
        // 회원가입
        register: async (email: string, full_name: string, password: string, password_confirmation: string) => {
          set({ isLoading: true, error: null });
          
          try {
            if (password !== password_confirmation) {
              throw new Error('비밀번호가 일치하지 않습니다');
            }
            
            // 이메일 중복 체크
            const emailExists = await get().checkEmailExists(email);
            if (emailExists) {
              throw new Error('이미 사용 중인 이메일입니다');
            }
            
            // Supabase 회원가입
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name,
                  role: 'advertiser'
                }
              }
            });
            
            if (error) {
              throw error;
            }
            
            set({ isLoading: false });
            return { data, error: null };
            
          } catch (error: any) {
            // 회원가입 실패
            
            set({
              error: {
                code: error.code || 'REGISTER_ERROR',
                message: error.message || '회원가입 중 오류가 발생했습니다',
                details: error
              },
              isLoading: false
            });
            
            return { data: null, error };
          }
        },
        
        // 로그아웃
        logout: async (navigate?: NavigateFunction) => {
          // LogoutService 사용
          const logoutService = LogoutService.getInstance();
          
          // 로그아웃 시작 시 상태 업데이트
          set({ isLoggingOut: true });
          
          // LogoutService를 통한 로그아웃 처리
          const result = await logoutService.logout(navigate);
          
          if (result.success) {
            // 상태 초기화
            set({
              auth: undefined,
              currentUser: null,
              isAuthenticated: false,
              isLoggingOut: false,
              authVerified: false,
              error: null
            });
          } else {
            // 에러 처리
            set({
              isLoggingOut: false,
              error: {
                code: result.error?.type || 'LOGOUT_ERROR',
                message: result.error?.message || '로그아웃 중 오류가 발생했습니다',
                details: result.error
              }
            });
          }
          
          return result.success;
        },
        
        // 인증 검증
        verify: async () => {
          set({ isLoading: true });
          
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
              throw new Error('세션이 없습니다');
            }
            
            // 메타데이터에서 역할 확인
            const metadataRole = session.user.user_metadata?.role;
            let customUser: CustomUser;
            
            // Beginner 역할인 경우 DB 조회 없이 바로 처리
            if (metadataRole === USER_ROLES.BEGINNER) {
              customUser = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || '',
                phone_number: '',
                role: USER_ROLES.BEGINNER,
                status: 'active',
                raw_user_meta_data: session.user.user_metadata
              };
            } else {
              // 비기너가 아닌 경우에만 users 테이블 조회
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userError) {
                // 사용자 정보 조회 실패
              }
              
              customUser = {
                ...session.user,
                ...(userData || {}),
                role: userData?.role || session.user.user_metadata?.role || 'beginner'
              } as CustomUser;
            }
            
            const authData: AuthModel = {
              api_token: session.access_token,
              access_token: session.access_token,
              refreshToken: session.refresh_token
            };
            
            set({
              auth: authData,
              currentUser: customUser,
              isAuthenticated: true,
              isLoading: false,
              authVerified: true,
              error: null
            });
            
          } catch (error: any) {
            // 인증 검증 실패
            
            set({
              auth: undefined,
              currentUser: null,
              isAuthenticated: false,
              isLoading: false,
              authVerified: true,
              error: null // 검증 실패는 에러로 처리하지 않음
            });
          }
        },
        
        // 토큰 갱신
        refreshToken: async () => {
          try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              throw error;
            }
            
            if (!data.session) {
              throw new Error('세션 갱신 실패');
            }
            
            const authData: AuthModel = {
              api_token: data.session.access_token,
              access_token: data.session.access_token,
              refreshToken: data.session.refresh_token
            };
            
            authHelper.setAuth(authData);
            
            set({ auth: authData });
            
            // 토큰 갱신 성공
            return true;
            
          } catch (error) {
            // 토큰 갱신 실패
            return false;
          }
        },
        
        // 사용자 역할 갱신
        refreshUserRole: async () => {
          try {
            const { currentUser, isLoggingOut, isAuthenticated } = get();
            
            // 로그아웃 중이거나 인증되지 않은 경우 실행하지 않음
            if (!currentUser || isLoggingOut || !isAuthenticated) return;
            
            // 비기너 사용자는 DB 조회를 건너뛰고 현재 정보 유지
            if (currentUser.role === USER_ROLES.BEGINNER) {
              // 비기너는 users 테이블에 데이터가 없으므로 조회하지 않음
              return;
            }
            
            // DB에서 최신 사용자 정보 가져오기
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            
            if (error) {
              throw error;
            }
            
            const updatedUser: CustomUser = {
              ...currentUser,
              ...userData,
              role: userData.role || currentUser.role
            };
            
            set({ currentUser: updatedUser });
            
            // 사용자 역할 갱신 완료
            
          } catch (error) {
            // 사용자 역할 갱신 실패
          }
        },
        
        // 이메일 중복 확인
        checkEmailExists: async (email: string) => {
          try {
            // auth.users 대신 RPC 함수 사용 (RLS 우회)
            const { data, error } = await supabase
              .rpc('check_email_exists', { email_to_check: email });
            
            if (error) {
              console.warn('이메일 중복 확인 실패, 기본값으로 처리:', error);
              // 406 에러 등으로 실패하면 중복이 아닌 것으로 처리
              return false;
            }
            
            return data || false;
          } catch (error) {
            console.warn('이메일 중복 확인 실패:', error);
            // 에러 발생 시 중복이 아닌 것으로 처리
            return false;
          }
        },
        
        // 비밀번호 재설정
        resetPassword: async (email: string) => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/#/auth/reset-password/change`
            });
            
            if (error) {
              throw error;
            }
            
          } catch (error: any) {
            // 비밀번호 재설정 실패
            throw error;
          }
        },
        
        // 비밀번호 재설정 링크 요청
        requestPasswordResetLink: async (email: string) => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/#/auth/reset-password/change`
            });
            
            if (error) {
              throw error;
            }
            
          } catch (error: any) {
            // 비밀번호 재설정 링크 요청 실패
            throw error;
          }
        },
        
        // 비밀번호 변경
        changePassword: async (email: string, token: string, newPassword: string, confirmPassword: string) => {
          try {
            if (newPassword !== confirmPassword) {
              throw new Error('비밀번호가 일치하지 않습니다');
            }
            
            // 토큰으로 세션 설정 (비밀번호 재설정 토큰 사용)
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: token
            });

            if (sessionError) {
              console.error('세션 설정 오류:', sessionError);
              throw new Error('인증 토큰이 유효하지 않습니다. 비밀번호 재설정 링크를 다시 요청해주세요.');
            }
            
            const { error } = await supabase.auth.updateUser({
              password: newPassword
            });
            
            if (error) {
              console.error('비밀번호 변경 오류:', error);
              if (error.message.includes('expired')) {
                throw new Error('토큰이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.');
              }
              throw new Error(error.message);
            }
            
            // 세션 정리 (비밀번호 변경 후 재로그인 필요)
            await supabase.auth.signOut();
            
          } catch (error: any) {
            // 비밀번호 변경 실패
            throw error;
          }
        },
        
        // 사용자 전환 시작
        impersonateUser: async (targetUserId: string, reason?: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // 현재 인증 정보 백업
            const currentAuth = get().auth;
            const currentUser = get().currentUser;
            
            if (!currentAuth || !currentUser) {
              throw new Error('현재 사용자 정보를 찾을 수 없습니다');
            }
            
            // 권한 확인
            if (currentUser.role !== USER_ROLES.DEVELOPER && currentUser.role !== USER_ROLES.OPERATOR) {
              throw new Error('권한이 없습니다');
            }
            
            // RPC 함수 호출
            const { data, error } = await supabase.rpc('impersonate_user', {
              p_target_user_id: targetUserId,
              p_reason: reason
            });
            
            if (error || !data?.success) {
              throw new Error(data?.error || error?.message || '사용자 전환에 실패했습니다');
            }
            
            const targetUser = data.target_user;
            
            // 대상 사용자 정보로 상태 업데이트
            const impersonatedUser: CustomUser = {
              id: targetUser.id,
              email: targetUser.email,
              full_name: targetUser.full_name,
              role: targetUser.role,
              status: targetUser.status,
              avatar: targetUser.metadata?.avatar || '',
              agency_id: targetUser.metadata?.agency_id,
              distributor_id: targetUser.metadata?.distributor_id,
              parent_path: targetUser.metadata?.parent_path || []
            };
            
            set({
              originalAuth: currentAuth,
              originalUser: currentUser,
              currentUser: impersonatedUser,
              isImpersonating: true,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return true;
          } catch (error: any) {
            set({ 
              error: {
                code: 'IMPERSONATION_ERROR',
                message: error.message || '사용자 전환 중 오류가 발생했습니다'
              },
              isLoading: false
            });
            return false;
          }
        },
        
        // 사용자 전환 종료
        stopImpersonation: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const originalAuth = get().originalAuth;
            const originalUser = get().originalUser;
            
            if (!originalAuth || !originalUser) {
              throw new Error('원래 사용자 정보를 찾을 수 없습니다');
            }
            
            // RPC 함수 호출
            const { error } = await supabase.rpc('stop_impersonation');
            
            if (error) {
              throw error;
            }
            
            // 원래 사용자로 복원
            set({
              auth: originalAuth,
              currentUser: originalUser,
              originalAuth: undefined,
              originalUser: undefined,
              isImpersonating: false,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // 인증 정보 저장
            authHelper.setAuth(originalAuth);
            
            return true;
          } catch (error: any) {
            set({ 
              error: {
                code: 'STOP_IMPERSONATION_ERROR',
                message: error.message || '전환 종료 중 오류가 발생했습니다'
              },
              isLoading: false
            });
            return false;
          }
        },
        
        // 활성 전환 확인
        getActiveImpersonation: async () => {
          try {
            const { data, error } = await supabase.rpc('get_active_impersonation');
            
            if (error) {
              throw error;
            }
            
            return data;
          } catch (error) {
            console.error('활성 전환 확인 실패:', error);
            return null;
          }
        },
        
        // 에러 클리어
        clearError: () => {
          set({ error: null });
        },
        
        // 로딩 상태 설정
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },
        
        // API 호출 보호
        protectedApiCall: async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
          if (get().isLoggingOut) {
            // 로그아웃 중 API 호출 차단됨
            return null;
          }
          
          try {
            return await apiCall();
          } catch (error) {
            // API 호출 실패
            throw error;
          }
        }
      }),
      {
        name: 'auth-store',
        // 로컬스토리지에 저장할 필드 선택 (사용자 전환 정보는 제외)
        partialize: (state) => ({
          auth: state.isImpersonating ? state.originalAuth : state.auth,
          currentUser: state.isImpersonating ? state.originalUser : state.currentUser
        })
      }
    )
  )
);