import { createContext, Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useState, useMemo } from "react";
import { AuthModel, CustomUser } from "../_models";
import * as authHelper from '../_helpers';
import { supabase } from "@/supabase";
import { useLogoutContext } from "@/contexts/LogoutContext";
import { USER_ROLES, getRoleLevel, hasPermission, PERMISSION_GROUPS } from "@/config/roles.config";

interface AuthContextProps {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    auth: AuthModel | undefined;
    saveAuth: (auth: AuthModel | undefined) => void;
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

const AuthProvider = ({ children }: PropsWithChildren) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [auth, setAuth] = useState<AuthModel | undefined>();
    const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);
    const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);
    const [authVerified, setAuthVerified] = useState<boolean>(false);
    const { setIsLoggingOut } = useLogoutContext();

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
    const saveAuth = useCallback((auth: AuthModel | undefined) => {
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
                    // 기본 사용자 정보 반환 - 메타데이터 역할 유지
                    const metadataRole = user.user_metadata?.role;

                    const basicUserData: CustomUser = {
                        id: user.id,
                        email: user.email || '',
                        full_name: user.user_metadata?.full_name || '',
                        phone_number: '',
                        role: metadataRole || USER_ROLES.ADVERTISER, // 기본 역할로 광고주 사용
                        status: 'active',
                        raw_user_meta_data: user.user_metadata
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
                    role: USER_ROLES.ADVERTISER, // 기본 역할로 광고주 사용
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
                        // 캐시 복원 실패 시 무시
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
                                        // 캐시 저장 실패 시 무시
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

    // 로그인 함수
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
                    // 캐시 저장 실패 시 무시
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

    const register = async (email: string, full_name: string, password: string, password_confirmation: string) => {
        setLoading(true);

        try {
            // 비밀번호 유효성 검사
            if (password !== password_confirmation) {
                throw new Error('비밀번호가 일치하지 않습니다.');
            }

            // Supabase Auth에 사용자 등록
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: full_name,
                        role: USER_ROLES.ADVERTISER // 기본 역할 설정
                    }
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            if (!data.user) {
                throw new Error('사용자 데이터가 없습니다');
            }

            try {
                // public.users 테이블에 사용자 정보 직접 삽입
                const newUser = {
                    id: data.user.id,
                    email: email,
                    full_name: full_name,
                    status: 'active',
                    role: USER_ROLES.ADVERTISER // 기본 역할
                };

                // 비밀번호 해시 생성
                const hashPassword = await supabase.rpc('hash_password', {
                    password: password
                });

                if (hashPassword.error) {
                    throw new Error(hashPassword.error.message);
                }

                // public.users 테이블에 사용자 정보 삽입
                const { error: insertError } = await supabase.from('users').insert([{
                    ...newUser,
                    password_hash: hashPassword.data
                }]);

                if (insertError) {
                    throw new Error(insertError.message);
                }

                // user_balances 테이블에 초기 잔액 정보 추가
                const { error: balanceError } = await supabase.from('user_balances').insert([{
                    user_id: data.user.id,
                    paid_balance: 0,
                    free_balance: 0,
                    total_balance: 0
                }]);

                // 잔액 정보 추가 실패는 회원가입 과정을 중단시키지 않음

                // 클라이언트측 인증 상태 초기화
                setAuth(undefined);
                setCurrentUser(null);
                authHelper.removeAuth();

                // Supabase 세션 로그아웃 처리
                try {
                    await supabase.auth.signOut();
                } catch (logoutError) {
                    // 로그아웃 실패 시 무시
                }

                // 로컬 스토리지에서 Supabase 관련 항목 제거
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (dbError: any) {
                throw new Error(dbError.message);
            }

            return data;
        } catch (error: any) {
            throw new Error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const verify = async () => {
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
                        // 캐시 저장 실패 시 무시
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

    // 운영자와 일반 사용자를 위한 별도의 로그아웃 로직
    const logoutForOperator = async () => {
        try {
            // 1. 로그아웃 플래그 설정
            setIsLoggingOut(true);

            // 2. 모든 구독 및 훅 정리 시간 확보 (비동기 태스크 이전에 UI 업데이트가 완료되도록)
            await new Promise(resolve => setTimeout(resolve, 50));

            // 3. 페이지 이동을 위한 준비
            window.location.href = '/auth/login'; // 페이지 리다이렉트 준비

            // 4. 로컬 및 세션 스토리지 정리 전에 리다이렉트 실행
            setTimeout(() => {
                // 로컬 스토리지 데이터 정리
                authHelper.removeAuth();
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('lastAuthCheck');

                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
                        localStorage.removeItem(key);
                    }
                });

                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
                        sessionStorage.removeItem(key);
                    }
                });

                // 서버 로그아웃을 제일 마지막에 수행
                supabase.auth.signOut().catch(e => {
                    // 서버 로그아웃 오류 시 무시
                });
            }, 0);

            return true;
        } catch (error: any) {
            return false;
        }
    };
    
    // 일반 로그아웃 함수
    const logout = async () => {
        try {
            // 현재 사용자가 운영자/관리자인 경우 특별 로그아웃 처리
            if (currentUser?.role && hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
                return await logoutForOperator();
            }

            // 일반 사용자 로그아웃 시작
            setIsLoggingOut(true);

            // 1. 먼저 서버 측 로그아웃 처리 (모든 상태 변경 전에 수행)
            try {
                await supabase.auth.signOut();
            } catch (serverError) {
                // 서버 로그아웃에 실패해도 계속 진행
            }

            // 2. 클라이언트 측 인증 정보 초기화
            authHelper.removeAuth();

            // 3. 로컬 및 세션 스토리지 정리 (상태 업데이트 전에)
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('lastAuthCheck');

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                }
            });

            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
                    sessionStorage.removeItem(key);
                }
            });

            // 4. 상태 업데이트 (스토리지 정리 이후)
            // 예측 가능한 순서로 상태 업데이트
            setAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);

            return true;
        } catch (error: any) {
            return false;
        }
    }

    // 계산된 값들
    const isAuthenticated = !!auth && !!currentUser;
    // 여러 역할 형태 지원 (role, raw_user_meta_data.role 등)
    const userRole = currentUser?.role ||
        (currentUser?.raw_user_meta_data?.role) ||
        'guest';

    // 역할 정보 관리
    useEffect(() => {
        // currentUser나 userRole이 변경될 때 역할 정보가 자동으로 업데이트됨
    }, [currentUser, userRole]);

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