import { createContext, Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useState, useMemo } from "react";
import { AuthModel, CustomUser } from "../_models";
import * as authHelper from '../_helpers';
import { supabase } from "@/supabase";
import { useLogoutContext } from "@/contexts/LogoutContext";
import { USER_ROLES, getRoleLevel, hasPermission, PERMISSION_GROUPS } from "@/config/roles.config";
import { syncedLogout } from "@/utils/logoutSafety";

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
    checkEmailExists: (email: string) => Promise<boolean>; // 이메일 중복 체크 함수 추가
    refreshUserRole: () => Promise<void>; // role 강제 새로고침 함수
}

const AuthContext = createContext<AuthContextProps | null>(null);

// Supabase 세션 캐싱을 위한 변수
let cachedSession: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 60000; // 1분

// 전역 토큰 갱신 매니저
const tokenRefreshManager = (() => {
    let isRefreshing = false;
    let refreshPromise: Promise<boolean> | null = null;

    return {
        refresh: async (refreshFn: () => Promise<boolean>) => {
            if (isRefreshing && refreshPromise) {
                return refreshPromise;
            }

            isRefreshing = true;
            refreshPromise = refreshFn().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });

            return refreshPromise;
        }
    };
})();

// 성능 모니터링 유틸리티
const performanceMonitor = {
    mark: (name: string) => {
        if (process.env.NODE_ENV === 'development') {
            try {
                performance.mark(name);
            } catch (e) {
                // 무시
            }
        }
    },

    measure: (name: string, startMark: string, endMark: string) => {
        if (process.env.NODE_ENV === 'development') {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name)[0];
            } catch (e) {
                // 무시
            }
        }
    },

    measureAsync: async function <T>(name: string, fn: () => Promise<T>): Promise<T> {
        if (process.env.NODE_ENV === 'development') {
            const start = performance.now();
            try {
                const result = await fn();
                const end = performance.now();
                return result;
            } catch (error) {
                const end = performance.now();
                throw error;
            }
        } else {
            return fn();
        }
    }
};

const AuthProvider = ({ children }: PropsWithChildren) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [auth, setAuth] = useState<AuthModel | undefined>();
    const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);
    const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);
    const [authVerified, setAuthVerified] = useState<boolean>(false);
    const { setIsLoggingOut } = useLogoutContext();

    // 비동기 캐시 검증 함수
    const validateCache = useCallback(async (): Promise<CustomUser | null> => {
        return new Promise((resolve) => {
            const cachedUserStr = sessionStorage.getItem('currentUser');
            if (!cachedUserStr) {
                resolve(null);
                return;
            }

            // requestAnimationFrame을 사용하여 다음 프레임에서 처리
            requestAnimationFrame(() => {
                try {
                    const user = JSON.parse(cachedUserStr);
                    resolve(user);
                } catch (e) {
                    console.warn('캐시 파싱 실패:', e);
                    resolve(null);
                }
            });
        });
    }, []);

    // 캐시된 세션 가져오기 함수
    const getCachedSession = useCallback(async () => {
        const now = Date.now();

        // 캐시가 유효한 경우
        if (cachedSession && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
            return { data: { session: cachedSession }, error: null };
        }

        // 새로 조회
        const result = await supabase.auth.getSession();
        if (result.data.session) {
            cachedSession = result.data.session;
            sessionCacheTime = now;
        }

        return result;
    }, []);

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
        return performanceMonitor.measureAsync('Token Refresh', async () => {
            try {
                const storeAuth = authHelper.getAuth();
                if (!storeAuth) return false;

                // 캐시된 세션 사용
                const { data, error } = await getCachedSession();

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
        });
    }, [saveAuth, getCachedSession]);

    // 토큰 유효성 확인 함수 - 간소화된 버전
    const checkTokenValidity = useCallback(async (): Promise<boolean> => {
        if (!auth?.access_token) return false;

        try {
            const decoded = decodeToken(auth.access_token);
            if (!decoded?.exp) return false;

            const expiryTime = decoded.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;

            // 만료되었거나 10분 이내에 만료되면 갱신
            if (timeUntilExpiry <= 600000) {
                return await refreshToken();
            }

            return true;
        } catch (error) {
            console.error('토큰 유효성 확인 오류:', error);
            return false;
        }
    }, [auth?.access_token, decodeToken, refreshToken]);

    // 사용자 정보를 가져오는 함수 - 병렬 처리 최적화
    const getUser = useCallback(async (): Promise<CustomUser | null> => {
        return performanceMonitor.measureAsync('Get User', async () => {
            try {
                // 캐시된 세션 사용
                const { data: sessionData, error: sessionError } = await getCachedSession();

                if (sessionError || !sessionData.session || !sessionData.session.user) {
                    return null;
                }

                const user = sessionData.session.user;
                const metadataRole = user.user_metadata?.role;

                // 비기너 역할 최적화 - users 테이블 조회 스킵
                if (metadataRole === USER_ROLES.BEGINNER) {
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

                // 비기너가 아닌 경우에만 users 테이블 조회
                try {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select("*")
                        .eq('id', user.id)
                        .single();

                    if (userError) {
                        // 기본 사용자 정보 반환
                        const basicUserData: CustomUser = {
                            id: user.id,
                            email: user.email || '',
                            full_name: user.user_metadata?.full_name || '',
                            phone_number: '',
                            role: metadataRole || USER_ROLES.ADVERTISER,
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
                        role: metadataRole || USER_ROLES.ADVERTISER,
                        status: 'active',
                        raw_user_meta_data: user.user_metadata
                    };
                    return basicUserData;
                }

            } catch (error: any) {
                return null;
            }
        });
    }, [getCachedSession]);

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

    // 초기 로드 시 인증 상태 확인 - 최적화된 버전
    useEffect(() => {
        const initAuth = async () => {
            performanceMonitor.mark('auth-init-start');
            try {
                const storeAuth = authHelper.getAuth();

                if (!storeAuth) {
                    setLoading(false);
                    setAuthInitialized(true);
                    return;
                }

                setAuth(storeAuth);

                // 1단계: 비동기 캐시 검증으로 즉시 UI 표시
                const cachedUser = await validateCache();

                if (cachedUser) {
                    setCurrentUser(cachedUser);
                    setLoading(false);
                    setAuthVerified(true);
                } else {
                    setLoading(false); // 캐시가 없어도 로딩 해제
                }

                // 2단계: 백그라운드에서 데이터 갱신 (UI 블로킹 없음)
                const updateAuthData = async () => {
                    try {
                        // 순차적 실행으로 경쟁 조건 해결
                        // 1. 먼저 토큰 갱신
                        const isTokenValid = await refreshToken();

                        if (!isTokenValid) {
                            // 토큰이 유효하지 않으면 로그아웃 처리
                            setAuth(undefined);
                            setCurrentUser(null);
                            setAuthVerified(false);
                            authHelper.removeAuth();
                            sessionStorage.removeItem('currentUser');
                            sessionStorage.removeItem('lastAuthCheck');
                            return;
                        }

                        // 2. 토큰이 유효한 경우에만 사용자 정보 조회
                        const userData = await getUser();

                        if (userData) {
                            setCurrentUser(userData);
                            setAuthVerified(true);
                            // 갱신된 데이터 캐싱
                            sessionStorage.setItem('currentUser', JSON.stringify(userData));
                            sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                        }
                    } catch (error) {
                        console.error('백그라운드 인증 업데이트 실패:', error);
                        // 오류 시에도 기존 인증 상태 유지 (사용자 경험 우선)
                    }
                };

                // 마이크로태스크 큐 활용으로 성능 최적화
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(() => updateAuthData());
                } else {
                    // Promise.resolve()를 사용하여 마이크로태스크로 실행
                    Promise.resolve().then(() => updateAuthData());
                }

            } catch (error) {
                console.error('초기화 오류:', error);
                setLoading(false);
                // 오류 시 인증 정보 제거
                authHelper.removeAuth();
                setAuth(undefined);
                setCurrentUser(null);
                setAuthVerified(false);
            } finally {
                setAuthInitialized(true);
                performanceMonitor.mark('auth-init-end');
                performanceMonitor.measure('Auth Initialization', 'auth-init-start', 'auth-init-end');
            }
        };

        initAuth();
    }, [refreshToken, getUser, validateCache]);

    // 스마트한 토큰 갱신 스케줄러
    useEffect(() => {
        if (!auth?.access_token) return;

        let refreshTimer: NodeJS.Timeout;

        const scheduleNextRefresh = () => {
            try {
                const decoded = decodeToken(auth.access_token);
                if (!decoded?.exp) return;

                const now = Date.now();
                const expiryTime = decoded.exp * 1000;
                const timeUntilExpiry = expiryTime - now;

                // 이미 만료된 경우 즉시 갱신
                if (timeUntilExpiry <= 0) {
                    performRefresh();
                    return;
                }

                // 만료 5분 전에 갱신 (최소 30초)
                const refreshIn = Math.max(30000, timeUntilExpiry - 300000);

                refreshTimer = setTimeout(() => {
                    performRefresh();
                }, refreshIn);
            } catch (error) {
                console.error('토큰 디코딩 실패:', error);
                // 오류 시 5분 후 재시도
                refreshTimer = setTimeout(performRefresh, 300000);
            }
        };

        const performRefresh = async () => {
            try {
                const success = await tokenRefreshManager.refresh(refreshToken);
                if (success) {
                    // 성공하면 다음 갱신 스케줄링
                    scheduleNextRefresh();
                } else {
                    // 갱신 실패 시 로그아웃
                    console.error('토큰 갱신 실패 - 로그아웃 처리');
                    // logout 함수가 아직 정의되지 않았으므로 직접 처리
                    setAuth(undefined);
                    setCurrentUser(null);
                    setAuthVerified(false);
                    authHelper.removeAuth();
                    sessionStorage.removeItem('currentUser');
                    sessionStorage.removeItem('lastAuthCheck');
                    window.location.replace('/auth/login');
                }
            } catch (error) {
                console.error('토큰 갱신 중 오류:', error);
                // 오류 시 1분 후 재시도
                refreshTimer = setTimeout(performRefresh, 60000);
            }
        };

        // 초기 스케줄링
        scheduleNextRefresh();

        return () => {
            if (refreshTimer) clearTimeout(refreshTimer);
        };
    }, [auth?.access_token, decodeToken, refreshToken]);

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

    // 로그인 함수 - 최적화된 버전
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

            // 세션의 user 객체에서 직접 사용자 정보 추출 (추가 API 호출 없음)
            const user = session.user;
            const metadataRole = user.user_metadata?.role;

            // 비기너인 경우 바로 사용자 정보 설정
            if (metadataRole === USER_ROLES.BEGINNER) {
                const beginnerUser: CustomUser = {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    phone_number: '',
                    role: USER_ROLES.BEGINNER,
                    status: 'active',
                    raw_user_meta_data: user.user_metadata
                };

                setCurrentUser(beginnerUser);
                setAuthVerified(true);

                // 캐싱
                sessionStorage.setItem('currentUser', JSON.stringify(beginnerUser));
                sessionStorage.setItem('lastAuthCheck', Date.now().toString());

                return true;
            }

            // 비기너가 아닌 경우에만 users 테이블 조회
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select("*")
                    .eq('id', user.id)
                    .single();

                const finalUser = userError ? {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    phone_number: '',
                    role: metadataRole || USER_ROLES.BEGINNER,
                    status: 'active',
                    raw_user_meta_data: user.user_metadata
                } : userData as CustomUser;

                setCurrentUser(finalUser);
                setAuthVerified(true);

                // 사용자 정보 캐싱
                sessionStorage.setItem('currentUser', JSON.stringify(finalUser));
                sessionStorage.setItem('lastAuthCheck', Date.now().toString());
            } catch (getUserError) {
                // users 테이블 조회 실패 시에도 기본 정보로 로그인 허용
                const basicUser: CustomUser = {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    phone_number: '',
                    role: metadataRole || USER_ROLES.BEGINNER,
                    status: 'active',
                    raw_user_meta_data: user.user_metadata
                };

                setCurrentUser(basicUser);
                setAuthVerified(true);

                sessionStorage.setItem('currentUser', JSON.stringify(basicUser));
                sessionStorage.setItem('lastAuthCheck', Date.now().toString());
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
            // 프로덕션 환경에서는 환경변수 사용, 없으면 현재 도메인 사용
            const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${baseUrl}/#/auth/reset-password/change`,
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

            // 토큰으로 세션 설정 (비밀번호 재설정 토큰 사용)
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: token
            });

            if (sessionError) {
                console.error('세션 설정 오류:', sessionError);
                throw new Error('인증 토큰이 유효하지 않습니다. 비밀번호 재설정 링크를 다시 요청해주세요.');
            }

            // Supabase API로 비밀번호 변경
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
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // 이메일 중복 체크 함수 - 데이터베이스 함수 사용
    const checkEmailExists = async (email: string) => {
        try {
            // 이메일 형식 유효성 체크
            if (!email || !/\S+@\S+\.\S+/.test(email)) {
                return false;
            }

            // 데이터베이스 함수 호출하여 이메일 중복 체크
            const { data, error } = await supabase
                .rpc('check_email_exists', {
                    email_to_check: email
                });

            if (error) {
                console.error('이메일 중복 체크 오류:', error.message);
                return false;
            }

            // 함수가 true를 반환하면 이메일이 이미 존재함
            return !!data;
        } catch (error) {
            console.error('이메일 중복 체크 중 예외 발생:', error);
            return false;
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
                        role: USER_ROLES.ADVERTISER // 광고주로 기본 역할 설정
                    }
                }
            });

            if (error) {
                console.error('Auth API 오류:', error);
                throw new Error(error.message);
            }

            if (!data.user) {
                console.error('사용자 데이터 없음');
                throw new Error('사용자 데이터가 없습니다');
            }

            try {
                // public.users 테이블에 사용자 정보 직접 삽입
                const newUser = {
                    id: data.user.id,
                    email: email,
                    full_name: full_name,
                    status: 'active',
                    role: USER_ROLES.ADVERTISER // 광고주로 기본 역할 설정
                };

                const hashPassword = await supabase.rpc('hash_password', {
                    password: password
                });

                if (hashPassword.error) {
                    console.error('비밀번호 해시 생성 오류:', hashPassword.error);
                    throw new Error(hashPassword.error.message);
                }

                // public.users 테이블에 사용자 정보 삽입
                const insertData = {
                    ...newUser,
                    password_hash: hashPassword.data
                };

                const { error: insertError } = await supabase.from('users').insert([insertData]);

                if (insertError) {
                    console.error('Users 테이블 삽입 오류:', {
                        code: insertError.code,
                        message: insertError.message,
                        details: insertError.details,
                        hint: insertError.hint
                    });
                    throw new Error(insertError.message);
                }


                // user_balances 테이블에 초기 잔액 정보 추가
                const { error: balanceError } = await supabase.from('user_balances').insert([{
                    user_id: data.user.id,
                    paid_balance: 0,
                    free_balance: 0,
                    total_balance: 0
                }]);

                // 클라이언트측 인증 상태 초기화
                setAuth(undefined);
                setCurrentUser(null);
                authHelper.removeAuth();

                // Supabase 세션 로그아웃 처리
                try {
                    await supabase.auth.signOut();
                } catch (logoutError) {
                    console.warn('로그아웃 실패:', logoutError);
                    // 로그아웃 실패 시 무시
                }

                // 로컬 스토리지에서 Supabase 관련 항목 제거
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase')) {
                        localStorage.removeItem(key);
                    }
                });

            } catch (dbError: any) {
                console.error('회원가입 DB 오류:', dbError);
                console.error('DB 오류 스택:', dbError.stack || '스택 없음');
                // auth 테이블에 사용자가 추가되었을 수 있으니 정리 시도
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    console.warn('오류 후 로그아웃 실패:', e);
                }
                throw new Error(dbError.message);
            }

            return data;
        } catch (error: any) {
            console.error('회원가입 최상위 오류:', error);
            console.error('오류 스택:', error.stack || '스택 없음');
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

    // 개선된 로그아웃 함수 - 안전한 순서로 처리
    const logout = useCallback(async () => {
        try {
            // 로그아웃 진행 중 플래그 설정
            setIsLoggingOut(true);

            // 1단계: 로컬 상태 초기화 (UI 즉시 반영)
            setAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);
            authHelper.removeAuth();

            // 2단계: Supabase 로그아웃 완료 대기
            try {
                await supabase.auth.signOut();
            } catch (signOutError) {
                console.error('Supabase 로그아웃 실패:', signOutError);
                // 실패해도 계속 진행
            }

            // 3단계: 앱 데이터만 선택적으로 정리 (Supabase 세션은 유지)
            const cleanupAppStorage = () => {
                // 우리 앱의 데이터만 삭제
                const appKeys = ['auth', 'currentUser', 'lastAuthCheck'];

                appKeys.forEach(key => {
                    try {
                        localStorage.removeItem(key);
                        sessionStorage.removeItem(key);
                    } catch (e) {
                        console.warn(`${key} 삭제 실패:`, e);
                    }
                });

                // 세션 스토리지의 앱 관련 데이터만 정리
                try {
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < sessionStorage.length; i++) {
                        const key = sessionStorage.key(i);
                        if (key && !key.startsWith('sb-')) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => sessionStorage.removeItem(key));
                } catch (e) {
                    console.warn('세션 스토리지 정리 실패:', e);
                }
            };

            cleanupAppStorage();

            // 4단계: 페이지 리다이렉트
            // HashRouter를 사용하므로 해시 변경으로 리다이렉션
            const timestamp = new Date().getTime();
            window.location.hash = `#/auth/login?t=${timestamp}`;

            return true;
        } catch (error) {
            console.error('로그아웃 오류:', error);

            // 오류 발생 시에도 최소한의 정리 수행
            setAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);
            authHelper.removeAuth();

            // 강제 리다이렉트
            const timestamp = new Date().getTime();
            window.location.hash = `#/auth/login?t=${timestamp}`;

            return false;
        } finally {
            // 로그아웃 완료 후 플래그 해제
            setTimeout(() => {
                setIsLoggingOut(false);
            }, 500);
        }
    }, [setIsLoggingOut]);

    // role 강제 새로고침 함수
    const refreshUserRole = useCallback(async () => {
        try {
            // 캐시 삭제
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('lastAuthCheck');

            // DB에서 새로 가져오기
            const freshUser = await getUser();
            if (freshUser) {
                setCurrentUser(freshUser);
                // 새 데이터 캐싱
                sessionStorage.setItem('currentUser', JSON.stringify(freshUser));
                sessionStorage.setItem('lastAuthCheck', Date.now().toString());
            }
        } catch (error) {
            console.error('Failed to refresh user role:', error);
        }
    }, [getUser]);

    // 계산된 값들
    const isAuthenticated = !!auth && !!currentUser;
    // 여러 역할 형태 지원 (role, raw_user_meta_data.role 등)
    const userRole = currentUser?.role ||
        (currentUser?.raw_user_meta_data?.role) ||
        'guest';

    // role 변경 주기적 확인 (5분마다)
    useEffect(() => {
        if (!isAuthenticated) return;

        // 초기 5초 후에 한 번 확인 (관리자가 role 변경 직후 빠른 반영을 위해)
        const initialCheck = setTimeout(() => {
            refreshUserRole();
        }, 5000);

        // 이후 5분마다 주기적으로 확인
        const interval = setInterval(() => {
            refreshUserRole();
        }, 5 * 60 * 1000); // 5분

        return () => {
            clearTimeout(initialCheck);
            clearInterval(interval);
        };
    }, [isAuthenticated, refreshUserRole]);

    // 비활성 시간 기반 자동 로그아웃 - 최적화된 버전
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)
    // const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 테스트용: 2분

    useEffect(() => {
        if (!isAuthenticated) return;

        let inactivityTimer: number;
        let lastActivity = Date.now();

        const resetInactivityTimer = (isInitial = false) => {
            const now = Date.now();
            // 초기 설정이 아닌 경우, 마지막 활동으로부터 1초 이상 지났을 때만 타이머 리셋
            if (!isInitial && now - lastActivity < 1000) return;

            lastActivity = now;

            if (inactivityTimer) clearTimeout(inactivityTimer);

            inactivityTimer = window.setTimeout(() => {
                logout();
            }, INACTIVITY_TIMEOUT);

            // 타이머 설정 완료
        };

        // throttle 함수 구현 (lodash 대신 간단한 구현)
        const throttle = (func: Function, delay: number) => {
            let lastCall = 0;
            return (...args: any[]) => {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    func(...args);
                }
            };
        };

        // throttle된 리셋 함수 (1초에 한 번만 실행)
        const throttledReset = throttle(resetInactivityTimer, 1000);

        // 초기 타이머 설정
        resetInactivityTimer(true); // 초기 설정임을 명시

        // 사용자 활동 이벤트 리스너 - 중요한 이벤트만 선택
        const events = ['mousedown', 'keypress', 'touchstart', 'mousemove', 'scroll', 'click'];
        // 이벤트 리스너 등록

        events.forEach(event => {
            window.addEventListener(event, throttledReset, { passive: true });
        });

        // 디버깅을 위한 타이머 상태 확인 (5분마다)
        const debugInterval = setInterval(() => {
        }, 5 * 60 * 1000);

        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            clearInterval(debugInterval);
            events.forEach(event => {
                window.removeEventListener(event, throttledReset);
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
        changePassword,
        checkEmailExists,
        refreshUserRole // role 강제 새로고침 함수 추가
    }), [
        loading, auth, currentUser, saveAuth,
        logout, verify, isAuthenticated, userRole,
        authVerified, refreshToken, getUserWithCache, refreshUserRole
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
};

export { AuthContext, AuthProvider }