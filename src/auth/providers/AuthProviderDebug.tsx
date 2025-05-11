import { createContext, Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useState, useMemo } from "react";
import { AuthModel, CustomUser } from "../_models";
import * as authHelper from '../_helpers';
import { supabase } from "@/supabase";

interface AuthContextProps {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    auth: AuthModel | undefined;
    saveAuth: (auth:AuthModel | undefined) => void;
    currentUser: CustomUser | null;
    setCurrentUser: Dispatch<SetStateAction<CustomUser | null>>;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, full_name: string, password: string, password_confirmation: string) => Promise<any>;
    getUser: () => Promise<CustomUser | null>;
    logout: () => Promise<any>;
    verify: () => Promise<void>;
    // 추가된 속성들
    isAuthenticated: boolean;
    userRole: string;
    authVerified: boolean;  // 인증 검증 완료 여부
    refreshToken: () => Promise<boolean>;
    resetPassword: (email: string) => Promise<void>; // 비밀번호 재설정 함수 추가
    requestPasswordResetLink: (email: string) => Promise<void>; // 비밀번호 재설정 링크 요청
    changePassword: (email: string, token: string, newPassword: string, confirmPassword: string) => Promise<void>; // 비밀번호 변경
}

const AuthContext = createContext<AuthContextProps | null>(null);

const AuthProvider = ({children} : PropsWithChildren) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [auth, setAuth] = useState<AuthModel | undefined>();
    const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);
    const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);
    const [authVerified, setAuthVerified] = useState<boolean>(false);

    // 토큰 디코딩 함수
    const decodeToken = useCallback((token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            
            return null;
        }
    }, []);

    // saveAuth 함수 정의
    const saveAuth = useCallback((auth:AuthModel | undefined) => {
        setAuth(auth);
        if (auth) {
            authHelper.setAuth(auth);
        } else {
            authHelper.removeAuth();
        }
    }, []);

    // 토큰 새로고침 함수
    const refreshToken = useCallback(async (): Promise<boolean> => {
        try {
            const storeAuth = authHelper.getAuth();
            if (!storeAuth) return false;

            
            // 현재 세션 가져오기
            const { data, error } = await supabase.auth.getSession();
            
            if (error || !data.session) {
                
                return false;
            }
            
            // 세션이 유효하면 auth 정보 업데이트
            const authData: AuthModel = {
                access_token: data.session.access_token,
                refreshToken: data.session.refresh_token,
                api_token: data.session.access_token
            };
            
            saveAuth(authData);
            setLastTokenCheck(Date.now());
            
            return true;
        } catch (error: any) {
            
            return false;
        }
    }, [saveAuth]);

    // 토큰 유효성 확인 함수 - refreshToken 선언 후 정의
    const checkTokenValidity = useCallback(async (): Promise<boolean> => {
        if (!auth?.access_token) return false;
        
        try {
            const decoded = decodeToken(auth.access_token);
            if (!decoded || !decoded.exp) return false;
            
            const expiryTime = decoded.exp * 1000; // 밀리초로 변환
            const currentTime = Date.now();
            
            // 이미 만료되었거나 10분 이내에 만료 예정이면 갱신
            if (currentTime >= expiryTime || expiryTime - currentTime < 10 * 60 * 1000) {
                
                return await refreshToken();
            }
            
            return true;
        } catch (error) {
            
            return false;
        }
    }, [auth, decodeToken, refreshToken]);

    // 사용자 정보를 가져오는 함수
    const getUser = useCallback(async (): Promise<CustomUser | null> => {
        try {
            // 먼저 세션이 유효한지 확인
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !sessionData.session) {
                
                return null;
            }
            
            // 사용자 정보 가져오기
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                
                return null;
            }
            
            
            
            try {
                // users 테이블에서 사용자 정보 조회
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select("*")
                    .eq('id', user.id)
                    .single();
                
                if (userError) {
                    
                    
                    // 사용자가 없으면 새로 생성
                    if (userError.code === 'PGRST116') { // not found 에러 코드
                        try {
                            const newUser = {
                                id: user.id,
                                email: user.email,
                                full_name: user.user_metadata?.full_name || '',
                                status: 'active',
                                role: 'advertiser'
                            };
                            
                            
                            
                            const { data: insertData, error: insertError } = await supabase
                                .from('users')
                                .insert([newUser])
                                .select();
                                
                            if (insertError) {
                                
                                return null;
                            }
                            
                            
                            return insertData[0] as CustomUser;
                        } catch (insertCatchError: any) {
                            
                            return null;
                        }
                    }
                    
                    // 기본 사용자 정보 반환
                    const basicUserData: CustomUser = {
                        id: user.id,
                        email: user.email || '',
                        full_name: user.user_metadata?.full_name || '',
                        phone_number: '',
                        role: 'user',
                        status: 'active'
                    };
                    return basicUserData;
                }
                
                
                return userData as CustomUser;
            } catch (error: any) {
                
                // 오류 시 기본 사용자 정보 반환
                const basicUserData: CustomUser = {
                    id: user.id,
                    email: user.email || '',
                    full_name: '',
                    phone_number: '',
                    role: 'user',
                    status: 'active'
                };
                return basicUserData;
            }
            
        } catch (error: any) {
            
            return null;
        }
    }, []);

    // 초기 로드 시 인증 상태 확인
    useEffect(() => {
        const initAuth = async () => {
            try {
                setLoading(true);
                const storeAuth = authHelper.getAuth();

                if (storeAuth) {
                    setAuth(storeAuth);
                    
                    // 세션 스토리지에서 임시 사용자 정보 복원
                    try {
                        const cachedUser = sessionStorage.getItem('currentUser');
                        if (cachedUser) {
                            const parsedUser = JSON.parse(cachedUser);
                            setCurrentUser(parsedUser);
                            
                        }
                    } catch (cacheError) {
                        
                    }
                    
                    // 백그라운드에서 토큰 갱신 및 사용자 정보 업데이트
                    setTimeout(async () => {
                        try {
                            // 토큰 새로고침 시도
                            const isRefreshed = await refreshToken();
                            
                            if (isRefreshed) {
                                // 사용자 정보 가져오기
                                const user = await getUser();
                                
                                if (user) {
                                    setCurrentUser(user);
                                    setAuthVerified(true);
                                    
                                    
                                    // 검증된 사용자 정보 캐싱
                                    try {
                                        sessionStorage.setItem('currentUser', JSON.stringify(user));
                                        sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                                    } catch (e) {
                                        
                                    }
                                } else {
                                    // 사용자 정보가 없으면 인증 정보 제거
                                    
                                    authHelper.removeAuth();
                                    setAuth(undefined);
                                    setCurrentUser(null);
                                    setAuthVerified(false);
                                    sessionStorage.removeItem('currentUser');
                                    sessionStorage.removeItem('lastAuthCheck');
                                }
                            } else {
                                // 토큰 갱신 실패 시 인증 정보 제거
                                
                                authHelper.removeAuth();
                                setAuth(undefined);
                                setCurrentUser(null);
                                setAuthVerified(false);
                                sessionStorage.removeItem('currentUser');
                                sessionStorage.removeItem('lastAuthCheck');
                            }
                        } catch (backgroundError) {
                            
                            // 오류 발생 시 인증 정보는 그대로 유지 (UI 깜빡임 방지)
                        }
                    }, 0);
                }
            } catch (error) {
                
                // 오류 발생 시 인증 정보 제거
                authHelper.removeAuth();
                setAuth(undefined);
                setCurrentUser(null);
                setAuthVerified(false);
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('lastAuthCheck');
            } finally {
                setLoading(false);
                setAuthInitialized(true);
            }
        };

        initAuth();
    }, []);

    // 주기적인 토큰 유효성 검사 및 갱신
    useEffect(() => {
        if (!auth) return;
        
        // 5분마다 토큰 유효성 확인
        const intervalId = setInterval(() => {
            checkTokenValidity();
        }, 5 * 60 * 1000);
        
        return () => clearInterval(intervalId);
    }, [auth, checkTokenValidity]);

    // Supabase 인증 상태 변경 구독
    useEffect(() => {
        if (!authInitialized) return;
        
        // Supabase의 세션 변경 이벤트 리스너 설정
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                

                // 비밀번호 변경 이벤트 (PASSWORD_RECOVERY)는 별도 처리
                if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
                    // 토큰만 갱신하고 전체 로그인 프로세스는 실행하지 않음
                    if (session) {
                    const authData: AuthModel = {
                        access_token: session.access_token,
                        refreshToken: session.refresh_token,
                        api_token: session.access_token
                    };
                    
                    setAuth(authData);
                    authHelper.setAuth(authData);
                    
                    }
                    return;
                }
                
                if (session) {
                    const authData: AuthModel = {
                        access_token: session.access_token,
                        refreshToken: session.refresh_token,
                        api_token: session.access_token
                    };
                    
                    setAuth(authData);
                    authHelper.setAuth(authData);
                    
                    // 사용자 정보 가져오기
                    const user = await getUser();
                    setCurrentUser(user);
                    
                } else if (event === 'SIGNED_OUT') {
                    // 로그아웃 이벤트 처리
                    setAuth(undefined);
                    setCurrentUser(null);
                    authHelper.removeAuth();
                    
                }
            }
        );
        
        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            subscription.unsubscribe();
        };
    }, [authInitialized, getUser]);

    // 로그인 함수 - 추가 디버깅 로깅
    const login = async (email: string, password: string) => {
        
        setLoading(true);
        
        try {
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                
                
                
                throw new Error(error.message);
            }

            
            if (!data || !data.session) {
                
                throw new Error('로그인 데이터가 없습니다');
            }

            
            const session = data.session;
            const authData: AuthModel = {
                access_token: session.access_token,
                refreshToken: session.refresh_token,
                api_token: session.access_token
            };

            // Auth Data 저장
            saveAuth(authData);
            
            try {
                
                const user = await getUser();
                
                
                if (!user) {
                    
                    throw new Error('사용자 정보를 가져올 수 없습니다.');
                }
                
                setCurrentUser(user);
                setAuthVerified(true);
                
                // 사용자 정보 캐싱
                try {
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                    sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                } catch (e) {
                    
                }
            } catch (getUserError) {
                
                throw new Error('사용자 정보를 가져오는데 실패했습니다.');
            }
            
            return true;
        } catch (error: any) {
            
            // 초기화
            saveAuth(undefined);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // 비밀번호 재설정 링크 요청 함수
    const requestPasswordResetLink = async (email: string) => {
        setLoading(true);
        try {
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            
            if (error) {
                
                throw new Error(error.message);
            }
            
            
        } catch (error: any) {
            
            throw error;
        } finally {
            setLoading(false);
        }
    }
    
    // 비밀번호 재설정 함수 (이전 버전과의 호환성 유지)
    const resetPassword = async (email: string) => {
        return requestPasswordResetLink(email);
    }
    
    // 비밀번호 변경 함수
    const changePassword = async (email: string, token: string, newPassword: string, confirmPassword: string) => {
        setLoading(true);
        try {
            if (newPassword !== confirmPassword) {
                throw new Error("비밀번호가 일치하지 않습니다.");
            }
            
            
            
            // Supabase API로 비밀번호 변경
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                
                throw new Error(error.message);
            }
            
            
        } catch (error: any) {
            
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const register = async(email:string, full_name:string, password:string, password_confirmation:string) => {
        setLoading(true);

        try {
            // 비밀번호 유효성 검사
            if (password !== password_confirmation) {
                throw new Error('비밀번호가 일치하지 않습니다.');
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: full_name
                    }
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            // public.users 테이블에 비밀번호 sync
            const hashPassword = await supabase.rpc('hash_password', {
                password: password
            });
            if (hashPassword.error) {
                throw new Error(hashPassword.error.message);
            }

            const {error: UpdateError} = await supabase
                .from('users')
                .update({password_hash: hashPassword.data})
                .eq('id', data.user?.id);

            if (UpdateError) {
                throw new Error(UpdateError.message);
            }
            
            return data;
        } catch (error:any) {
            throw new Error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const verify = async() => {
        if (!auth) return;
        
        setLoading(true);
        try {
            // 이미 검증된 상태라면 추가 작업 불필요
            if (authVerified && currentUser) {
                
                setLoading(false);
                return;
            }
            
            // 토큰 갱신 시도
            const isRefreshed = await refreshToken();
            
            if (isRefreshed) {
                // 사용자 정보 가져오기
                const user = await getUser();
                if (user) {
                    setCurrentUser(user);
                    setAuthVerified(true);
                    
                    // 검증된 사용자 정보 캐싱
                    try {
                        sessionStorage.setItem('currentUser', JSON.stringify(user));
                        sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                    } catch (e) {
                        
                    }
                } else {
                    // 사용자 정보가 없으면 로그아웃
                    saveAuth(undefined);
                    setCurrentUser(null);
                    setAuthVerified(false);
                    sessionStorage.removeItem('currentUser');
                    sessionStorage.removeItem('lastAuthCheck');
                }
            } else {
                // 토큰 갱신 실패 시 로그아웃
                saveAuth(undefined);
                setCurrentUser(null);
                setAuthVerified(false);
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('lastAuthCheck');
            }
        } catch (error) {
            
            saveAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('lastAuthCheck');
        } finally {
            setLoading(false);
        }
    }

    const logout = async () => {
        
        setLoading(true);

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw new Error(error.message);
            }

            
            authHelper.removeAuth();
            setAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);
            
            // 세션 스토리지 정리
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('lastAuthCheck');
        } catch (error: any) {
            
            throw new Error(error?.message || '오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    }

    // 계산된 값들
    const isAuthenticated = !!auth && !!currentUser;
    const userRole = currentUser?.role || 'guest';

    // 메모이제이션된 컨텍스트 값
    const contextValue = useMemo(() => ({
        loading,
        setLoading,
        auth,
        saveAuth,
        currentUser,
        setCurrentUser,
        login,
        register,
        getUser,
        verify,
        logout,
        isAuthenticated,
        userRole,
        authVerified,
        refreshToken,
        resetPassword,
        requestPasswordResetLink,
        changePassword
    }), [
        loading, auth, currentUser, saveAuth, 
        logout, verify, isAuthenticated, userRole, 
        authVerified, refreshToken, getUser
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
};

export { AuthContext, AuthProvider }