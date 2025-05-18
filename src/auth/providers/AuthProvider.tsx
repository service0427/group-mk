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
            // 토큰 디코딩
            const decoded = decodeToken(auth.access_token);
            if (!decoded || !decoded.exp) return false;

            const expiryTime = decoded.exp * 1000; // 밀리초로 변환
            const currentTime = Date.now();

            // 만료 시간까지 여유가 충분하면 유효성 검사 스킵
            if (expiryTime - currentTime > 15 * 60 * 1000) {
                return true; // 15분 이상 남았다면 갱신하지 않음
            }

            // 이미 만료되었거나 10분 이내에 만료 예정이면 갱신
            if (currentTime >= expiryTime || expiryTime - currentTime < 10 * 60 * 1000) {
                return await refreshToken();
            }

            return true;
        } catch (error) {
            return false;
        }
    }, [auth, decodeToken, refreshToken]);

    // 사용자 정보를 가져오는 함수 - 중복 API 호출 최적화 및 초보자 역할 특별 처리
    const getUser = useCallback(async (): Promise<CustomUser | null> => {
        try {
            // 세션과 사용자 정보를 병렬로 요청
            const [sessionResponse, userResponse] = await Promise.all([
                supabase.auth.getSession(),
                supabase.auth.getUser()
            ]);

            if (sessionResponse.error || !sessionResponse.data.session) {
                return null;
            }

            if (userResponse.error || !userResponse.data.user) {
                return null;
            }

            const user = userResponse.data.user;

            // 사용자 메타데이터에서 역할 확인
            const metadataRole = user.user_metadata?.role;

            // 초보자 역할 확인 - 초보자인 경우 users 테이블 조회 스킵
            if (metadataRole === USER_ROLES.BEGINNER) {
                // 초보자는 메타데이터만 사용하여 기본 사용자 정보 생성
                const beginnerUserData: CustomUser = {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    phone_number: '',
                    role: USER_ROLES.BEGINNER,
                    status: 'active',
                    raw_user_meta_data: user.user_metadata
                };
                return beginnerUserData;
            }

            // 사용자 프로필 정보 병합 (초보자가 아닌 경우에만 실행)
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select("*")
                    .eq('id', user.id)
                    .single();

                if (userError) {
                    // 기본 사용자 정보 반환 - 메타데이터 역할 유지
                    const basicUserData: CustomUser = {
                        id: user.id,
                        email: user.email || '',
                        full_name: user.user_metadata?.full_name || '',
                        phone_number: '',
                        role: metadataRole || USER_ROLES.BEGINNER, // 기본 역할로 초보자 사용
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
                    full_name: user.user_metadata?.full_name || '',
                    phone_number: '',
                    role: metadataRole || USER_ROLES.BEGINNER, // 기본 역할로 초보자 사용
                    status: 'active',
                    raw_user_meta_data: user.user_metadata
                };
                return basicUserData;
            }

        } catch (error: any) {
            return null;
        }
    }, []);

    // 캐싱을 활용한 사용자 정보 조회 함수
    const getUserWithCache = useCallback(async (): Promise<CustomUser | null> => {
        try {
            // 캐시에서 사용자 정보 확인
            const cachedUserStr = sessionStorage.getItem('currentUser');
            const cachedTimeStr = sessionStorage.getItem('lastAuthCheck');

            // 캐시가 유효한지 확인 (10분 이내)
            if (cachedUserStr && cachedTimeStr) {
                const cachedTime = parseInt(cachedTimeStr);
                const now = Date.now();

                // 10분 이내에 캐시된 데이터라면 바로 반환
                if (now - cachedTime < 10 * 60 * 1000) {
                    return JSON.parse(cachedUserStr);
                }
            }

            // 캐시가 없거나 유효하지 않으면 새로 요청
            const user = await getUser();

            // 새 데이터 캐싱
            if (user) {
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                sessionStorage.setItem('lastAuthCheck', Date.now().toString());
            }

            return user;
        } catch (error) {
            return getUser(); // 캐싱 로직에 문제가 있으면 기본 요청 수행
        }
    }, [getUser]);

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

    // 주기적인 토큰 유효성 검사 및 갱신 - 최적화된 버전
    useEffect(() => {
        if (!auth) return;

        // 토큰 만료 시간을 계산하여 타이머 설정
        try {
            const decoded = decodeToken(auth.access_token);
            if (!decoded || !decoded.exp) return;

            const expiryTime = decoded.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;

            // 만료 10분 전이나 절반 시점 중 더 적은 시간으로 갱신 타이머 설정
            const refreshTime = Math.min(timeUntilExpiry - 10 * 60 * 1000, timeUntilExpiry / 2);
            const refreshInterval = Math.max(refreshTime, 60 * 1000); // 최소 1분

            const timerId = setTimeout(() => {
                checkTokenValidity();
            }, refreshInterval);

            return () => clearTimeout(timerId);
        } catch (error) {
            // 오류 발생 시 5분마다 검사 (기존 로직)
            const intervalId = setInterval(() => {
                checkTokenValidity();
            }, 5 * 60 * 1000);

            return () => clearInterval(intervalId);
        }
    }, [auth, checkTokenValidity, decodeToken]);

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
                        role: USER_ROLES.BEGINNER // 초보자로 기본 역할 설정
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
                    role: USER_ROLES.BEGINNER // 초보자로 기본 역할 설정
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

    // 스토리지 정리 함수 통합 (브라우저 환경 안전 처리)
    const clearAuthStorage = useCallback(() => {
        // 브라우저 환경이 아니면 실행하지 않음
        if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') {
            return;
        }

        // 모든 관련 항목 지우기
        const authKeys = [
            'auth',
            'currentUser',
            'lastAuthCheck'
        ];

        authKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            } catch (e) {
                // 무시
            }
        });

        // Supabase 관련 항목 정리
        const supabaseKeyPattern = /^(sb-|supabase|auth)/;

        try {
            Object.keys(localStorage)
                .filter(key => supabaseKeyPattern.test(key))
                .forEach(key => {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        // 무시
                    }
                });

            Object.keys(sessionStorage)
                .filter(key => supabaseKeyPattern.test(key))
                .forEach(key => {
                    try {
                        sessionStorage.removeItem(key);
                    } catch (e) {
                        // 무시
                    }
                });
        } catch (err) {
            // localStorage/sessionStorage에 접근할 수 없는 경우 오류 무시
            // 스토리지 접근 불가: 서버 환경
        }
    }, []);

    // 개선된 로그아웃 함수: 로그아웃과 페이지 전환 통합 (404 방지 버전)
    const logout = useCallback(async () => {
        try {
            // 1. 즉시 로그아웃 플래그 설정 - 사용자에게 작업 진행 중임을 표시
            setIsLoggingOut(true);

            // 로그아웃 플래그 미리 저장 (중요: 스토리지 정리 전에 먼저 설정)
            try {
                localStorage.setItem('auth_redirect', 'login');
                localStorage.setItem('logout_timestamp', Date.now().toString());
                sessionStorage.setItem('direct_to_login', 'true');
                sessionStorage.setItem('logout_complete', 'true');
            } catch (e) {
                // 플래그 저장 실패
            }

            // 2. 로그아웃 상태 설정 (전환 효과 제거 버전)
            if (typeof document !== 'undefined') {
                // 로그아웃 상태를 확인하기 위한 메타 태그만 추가
                const logoutMeta = document.createElement('meta');
                logoutMeta.name = 'app-logout-state';
                logoutMeta.content = 'in-progress';
                document.head.appendChild(logoutMeta);
            }

            // 3. 인증 데이터 먼저 제거 (백그라운드 작업 전 필수 단계)
            authHelper.removeAuth();
            setAuth(undefined);
            setCurrentUser(null);

            // 4. 모든 로그아웃 작업을 한 번에 처리
            setTimeout(async () => {

                // 인증 관련 스토리지 정리
                clearAuthStorage();

                // Supabase 로그아웃 (실제 로그아웃을 완료하기 위해 await 사용)
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                }

                // 페이지 전환을 위한 상태 저장 (브라우저 환경에서만)
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('auth_redirect', 'login');
                    localStorage.setItem('logout_timestamp', Date.now().toString());
                }

                // 이전 로그인 세션 데이터 완전 제거 (브라우저 환경에서만)
                if (typeof localStorage !== 'undefined') {
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                            localStorage.removeItem(key);
                        }
                    });
                }

                // 항상 새로운 페이지를 로드하도록 타임스탬프 추가
                const timestamp = Date.now();

                // 쿠키 정리 (브라우저 환경에서만)
                if (typeof document !== 'undefined') {
                    try {
                        const cookies = document.cookie.split(';');
                        for (let i = 0; i < cookies.length; i++) {
                            const cookie = cookies[i].trim();
                            if (cookie.startsWith('sb-') || cookie.includes('supabase')) {
                                const name = cookie.split('=')[0];
                                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
                                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
                            }
                        }
                    } catch (e) {
                        // 쿠키 정리 중 오류
                    }
                }

                // 브라우저 환경에서만 페이지 이동
                if (typeof window !== 'undefined') {

                    // 세션 스토리지 완전히 비우기
                    try { sessionStorage.clear(); } catch (e) { }

                    // 로그인 페이지 URL 생성 - URL 수정 (로그인 페이지 직접 접근)
                    // 해시 기반 라우팅에서는 #/auth/login 형식이 올바름
                    const baseUrl = window.location.origin;
                    const logoutUrl = `${baseUrl}/#/auth/login?_=${timestamp}&force=true`;

                    // 새로운 상태를 즉시 반영하기 위해 location.href 대신 replace 사용
                    window.location.replace(logoutUrl);
                }
            }, 100);  // 지연 시간 축소: 100ms

            return true;
        } catch (error) {
            // 오류 발생 시 안전하게 처리
            console.error('로그아웃 실패:', error);

            // 필수 정리 작업 수행
            if (typeof document !== 'undefined') {
                document.body.classList.add('is-logging-out');
            }

            clearAuthStorage();
            authHelper.removeAuth();

            // 오류 발생 시에도 로그인 페이지로 강제 이동
            setTimeout(() => {
                const timestamp = Date.now();

                // 오류 발생 후 강제 로그아웃

                // 세션 스토리지 초기화
                try {
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.clear();
                    }
                } catch (e) { }

                if (typeof window !== 'undefined') {
                    const baseUrl = window.location.origin;
                    // 올바른 형식: #/auth/login (앞에 슬래시 포함)
                    const logoutUrl = `${baseUrl}/#/auth/login?_=${timestamp}&force=true&error=1`;

                    // 페이지 새로고침
                    window.location.replace(logoutUrl);
                }
            }, 100); // 지연 시간 축소: 100ms

            return false;
        }
    }, [clearAuthStorage]);

    // 계산된 값들
    const isAuthenticated = !!auth && !!currentUser;
    // 여러 역할 형태 지원 (role, raw_user_meta_data.role 등)
    const userRole = currentUser?.role ||
        (currentUser?.raw_user_meta_data?.role) ||
        'guest';

    // 비활성 시간 기반 자동 로그아웃
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)

    useEffect(() => {
        if (!isAuthenticated) return;

        let inactivityTimer: number;

        const resetInactivityTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);

            inactivityTimer = window.setTimeout(() => {
                logout();
            }, INACTIVITY_TIMEOUT);
        };

        // 초기 타이머 설정
        resetInactivityTimer();

        // 사용자 활동 이벤트 리스너
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
        };
    }, [isAuthenticated, logout]);

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
        getUser: getUserWithCache, // 캐싱 버전 사용
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
        authVerified, refreshToken, getUserWithCache
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
};

export { AuthContext, AuthProvider }