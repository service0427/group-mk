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

    // saveAuth 함수 정의 - 메모리에만 저장
    const saveAuth = useCallback((auth: AuthModel | undefined) => {
        setAuth(auth);
        // localStorage에는 저장하지 않음 (authHelper.setAuth/removeAuth 호출 제거)
    }, []);

    // 토큰 새로고침 함수
    const refreshToken = useCallback(async (): Promise<boolean> => {
        try {
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

    // 사용자 정보를 가져오는 함수 - 병렬 처리 최적화
    const getUser = useCallback(async (): Promise<CustomUser | null> => {
        try {
            // 세션 정보만 먼저 확인 (사용자 정보는 이미 세션에 포함되어 있음)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

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
                        role: metadataRole || USER_ROLES.BEGINNER,
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
                    role: metadataRole || USER_ROLES.BEGINNER,
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
                // localStorage를 사용하지 않으므로 Supabase 세션에서 직접 확인
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const authData: AuthModel = {
                        access_token: session.access_token,
                        refreshToken: session.refresh_token,
                        api_token: session.access_token
                    };
                    setAuth(authData);

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

                    // 백그라운드에서 사용자 정보 업데이트
                    setTimeout(async () => {
                        try {
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
    }, [getUser]);

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

                    // 사용자 정보 가져오기
                    const user = await getUser();
                    setCurrentUser(user);
                } else if (event === 'SIGNED_OUT') {
                    // 로그아웃 이벤트 처리
                    setAuth(undefined);
                    setCurrentUser(null);
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
                        role: USER_ROLES.BEGINNER // 비기너로 기본 역할 설정
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
                    role: USER_ROLES.BEGINNER // 비기너로 기본 역할 설정
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

    // 개선된 로그아웃 함수 - 깜빡임 방지 및 안전한 상태 전환 처리
    const logout = useCallback(async () => {
        try {
            // 인증 상태 초기화 함수 정의
            const clearAuthState = () => {
                // 인증 상태 초기화
                setAuth(undefined);
                setCurrentUser(null);
                setAuthVerified(false);

                // Supabase 로그아웃 (비동기이지만 결과를 기다리지 않음)
                try {
                    supabase.auth.signOut();
                } catch (e) {

                }

                // 로컬 스토리지 정리
                if (typeof localStorage !== 'undefined') {
                    try {
                        // Supabase 및 인증 관련 항목 모두 제거
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('sb-') ||
                                key.includes('supabase') ||
                                key.includes('auth') ||
                                key.includes('user') ||
                                key.includes('token')) {
                                localStorage.removeItem(key);
                            }
                        });
                    } catch (_) { }
                }

                // 세션 스토리지 정리
                if (typeof sessionStorage !== 'undefined') {
                    try {
                        sessionStorage.clear();
                    } catch (_) { }
                }
            };

            // 네비게이션 함수 정의
            const navigateToLogin = (path: string) => {
                window.location.hash = path;
            };

            // syncedLogout 함수를 사용하여 로그아웃 프로세스 실행
            // 이 함수는 정확한 순서로 상태 변경, 스토리지 정리, 네비게이션을 처리합니다
            await syncedLogout(clearAuthState, navigateToLogin, setIsLoggingOut);

            return true;
        } catch (error) {
            console.error("로그아웃 오류:", error);

            // 오류 발생 시 수동으로 인증 상태 초기화
            setAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);

            // 로그인 페이지로 이동 시도
            try {
                const timestamp = new Date().getTime();
                window.location.hash = `/auth/login?t=${timestamp}`;
            } catch (_) { }

            // 로그아웃 상태 해제 - 전환 효과 종료
            setIsLoggingOut(false);

            return false;
        }
    }, [setIsLoggingOut]);

    // 계산된 값들
    const isAuthenticated = !!auth && !!currentUser;
    // 여러 역할 형태 지원 (role, raw_user_meta_data.role 등)
    const userRole = currentUser?.role ||
        (currentUser?.raw_user_meta_data?.role) ||
        'guest';

    // 비활성 시간 기반 자동 로그아웃 - 최적화된 버전
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)

    useEffect(() => {
        if (!isAuthenticated) return;

        let inactivityTimer: number;
        let lastActivity = Date.now();

        const resetInactivityTimer = () => {
            const now = Date.now();
            // 마지막 활동으로부터 1초 이상 지났을 때만 타이머 리셋
            if (now - lastActivity < 1000) return;

            lastActivity = now;

            if (inactivityTimer) clearTimeout(inactivityTimer);

            inactivityTimer = window.setTimeout(() => {
                logout();
            }, INACTIVITY_TIMEOUT);
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
        resetInactivityTimer();

        // 사용자 활동 이벤트 리스너 - 중요한 이벤트만 선택
        const events = ['mousedown', 'keypress', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, throttledReset);
        });

        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
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
        checkEmailExists
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