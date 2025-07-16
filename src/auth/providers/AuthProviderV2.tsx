import { createContext, PropsWithChildren, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModel, CustomUser } from "../_models";
import * as authHelper from '../_helpers';
import { supabase } from "@/supabase";
import { useLogoutContext } from "@/contexts/LogoutContext";
import { USER_ROLES, getRoleLevel, hasPermission, PERMISSION_GROUPS } from "@/config/roles.config";
import { LogoutService } from "@/services/auth/LogoutService";
import { ActivityMonitor } from "@/utils/ActivityMonitor";
import { useAuthStore } from "@/stores/authStore";

interface AuthContextProps {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    auth: AuthModel | undefined;
    saveAuth: (auth: AuthModel | undefined) => void;
    currentUser: CustomUser | null;
    setCurrentUser: (user: CustomUser | null) => void;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, full_name: string, password: string, password_confirmation: string) => Promise<any>;
    getUser: () => Promise<CustomUser | null>;
    logout: () => Promise<any>;
    verify: () => Promise<void>;
    isAuthenticated: boolean;
    userRole: string;
    authVerified: boolean;
    refreshToken: () => Promise<boolean>;
    resetPassword: (email: string) => Promise<void>;
    requestPasswordResetLink: (email: string) => Promise<void>;
    changePassword: (email: string, token: string, newPassword: string, confirmPassword: string) => Promise<void>;
    checkEmailExists: (email: string) => Promise<boolean>;
    refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

/**
 * 개선된 AuthProvider - 새로운 서비스 활용
 */
const AuthProviderV2 = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const { setIsLoggingOut, safeApiCall } = useLogoutContext();
    const logoutService = LogoutService.getInstance();
    const activityMonitor = useRef(new ActivityMonitor(30)); // 30분 타임아웃
    
    // Zustand store 사용
    const {
        auth,
        currentUser,
        isAuthenticated,
        isLoading,
        isLoggingOut,
        authVerified,
        error,
        isImpersonating,
        login: storeLogin,
        register: storeRegister,
        logout: storeLogout,
        verify: storeVerify,
        refreshToken: storeRefreshToken,
        refreshUserRole: storeRefreshUserRole,
        checkEmailExists: storeCheckEmailExists,
        resetPassword: storeResetPassword,
        requestPasswordResetLink: storeRequestPasswordResetLink,
        changePassword: storeChangePassword,
        setLoading: storeSetLoading,
        protectedApiCall
    } = useAuthStore();
    
    // 추가 상태 (호환성을 위해)
    const [localLoading, setLocalLoading] = useState(isLoading);
    
    // 로그아웃 서비스 이벤트 리스너 설정
    useEffect(() => {
        const unsubscribeStart = logoutService.onLogoutStart(() => {
            setIsLoggingOut(true);
        });
        
        const unsubscribeComplete = logoutService.onLogoutComplete((result) => {
            if (result.success) {
                // 로그아웃 완료
            } else {
                // 로그아웃 실패
            }
            // 약간의 딜레이 후 플래그 해제
            setTimeout(() => {
                setIsLoggingOut(false);
            }, 300);
        });
        
        return () => {
            unsubscribeStart();
            unsubscribeComplete();
        };
    }, [setIsLoggingOut]);
    
    // 사용자 정보 가져오기 (캐싱 포함)
    const getUser = useCallback(async (): Promise<CustomUser | null> => {
        return safeApiCall(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session?.user) {
                    return null;
                }
                
                // 캐시 확인
                const cachedUser = sessionStorage.getItem('currentUser');
                const lastCheck = sessionStorage.getItem('lastAuthCheck');
                
                if (cachedUser && lastCheck) {
                    const timeDiff = Date.now() - parseInt(lastCheck);
                    if (timeDiff < 60000) { // 1분 이내면 캐시 사용
                        return JSON.parse(cachedUser);
                    }
                }
                
                // 메타데이터에서 역할 확인
                const metadataRole = session.user.user_metadata?.role;
                
                // Beginner 역할인 경우 DB 조회 없이 바로 반환
                if (metadataRole === USER_ROLES.BEGINNER) {
                    const beginnerUser: CustomUser = {
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.full_name || '',
                        phone_number: '',
                        role: USER_ROLES.BEGINNER,
                        status: 'active',
                        raw_user_meta_data: session.user.user_metadata
                    };
                    
                    // 캐시 업데이트
                    sessionStorage.setItem('currentUser', JSON.stringify(beginnerUser));
                    sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                    
                    return beginnerUser;
                }
                
                // 비기너가 아닌 경우에만 users 테이블 조회
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (error) {
                    // 사용자 정보 조회 실패
                    return null;
                }
                
                const customUser: CustomUser = {
                    ...session.user,
                    ...userData,
                    role: userData?.role || session.user.user_metadata?.role || 'beginner'
                } as CustomUser;
                
                // 캐시 업데이트
                sessionStorage.setItem('currentUser', JSON.stringify(customUser));
                sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                
                return customUser;
                
            } catch (error) {
                // 사용자 정보 가져오기 실패
                return null;
            }
        }, null);
    }, [safeApiCall]);
    
    // 개선된 로그아웃 함수
    const logout = useCallback(async () => {
        return await storeLogout(navigate);
    }, [storeLogout, navigate]);
    
    // 활동 모니터링 설정 (30분 자동 로그아웃)
    useEffect(() => {
        if (!isAuthenticated) {
            activityMonitor.current.stop();
            return;
        }
        
        // 활동 모니터 시작
        activityMonitor.current.start(() => {
            // Inactivity timeout - auto logout
            logout();
        });
        
        return () => {
            activityMonitor.current.stop();
        };
    }, [isAuthenticated, logout]);
    
    // 역할 자동 갱신 (5분마다)
    useEffect(() => {
        if (!isAuthenticated) return;
        
        // 5분마다 확인 (초기 5초 확인 제거)
        const interval = setInterval(() => {
            // 로그아웃 중이거나 인증되지 않은 경우 실행하지 않음
            if (!isLoggingOut && isAuthenticated) {
                storeRefreshUserRole();
            }
        }, 5 * 60 * 1000);
        
        return () => {
            clearInterval(interval);
        };
    }, [isAuthenticated, storeRefreshUserRole, isLoggingOut]);
    
    // Supabase 인증 상태 변경 감지
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Auth state changed
            
            if (event === 'SIGNED_IN' && session) {
                // 로그인 성공 시 처리는 login 함수에서 수행
            } else if (event === 'SIGNED_OUT') {
                // 로그아웃 처리는 logout 함수에서 수행
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // 토큰 갱신 시 auth 정보 업데이트
                const authData: AuthModel = {
                    api_token: session.access_token,
                    access_token: session.access_token,
                    refreshToken: session.refresh_token
                };
                authHelper.setAuth(authData);
            }
        });
        
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    
    // 초기 인증 검증
    useEffect(() => {
        storeVerify();
    }, [storeVerify]);
    
    // 계산된 값
    const userRole = currentUser?.role || 
        (currentUser?.raw_user_meta_data?.role) || 
        'guest';
    
    // 로딩 상태 동기화
    useEffect(() => {
        setLocalLoading(isLoading);
    }, [isLoading]);
    
    // Context value
    const contextValue = useMemo(() => ({
        loading: localLoading,
        setLoading: (loading: boolean) => {
            setLocalLoading(loading);
            storeSetLoading(loading);
        },
        auth,
        saveAuth: (auth: AuthModel | undefined) => {
            if (auth) {
                authHelper.setAuth(auth);
            } else {
                authHelper.removeAuth();
            }
        },
        currentUser,
        setCurrentUser: () => {}, // Zustand store가 관리
        login: storeLogin,
        register: storeRegister,
        getUser,
        logout,
        verify: storeVerify,
        isAuthenticated,
        userRole,
        authVerified,
        refreshToken: storeRefreshToken,
        resetPassword: storeResetPassword,
        requestPasswordResetLink: storeRequestPasswordResetLink,
        changePassword: storeChangePassword,
        checkEmailExists: storeCheckEmailExists,
        refreshUserRole: storeRefreshUserRole
    }), [
        localLoading,
        auth,
        currentUser,
        storeLogin,
        storeRegister,
        getUser,
        logout,
        storeVerify,
        isAuthenticated,
        userRole,
        authVerified,
        storeRefreshToken,
        storeResetPassword,
        storeRequestPasswordResetLink,
        storeChangePassword,
        storeCheckEmailExists,
        storeRefreshUserRole,
        storeSetLoading,
        isImpersonating
    ]);
    
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProviderV2 };