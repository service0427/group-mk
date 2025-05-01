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
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, full_name: string, password: string, password_confirmation: string) => Promise<void>;
    getUser: () => Promise<CustomUser | null>;
    logout: () => Promise<void>;
    verify: () => Promise<void>;
    // 추가된 속성들
    isAuthenticated: boolean;
    userRole: string;
    authVerified: boolean;  // 인증 검증 완료 여부
    refreshToken: () => Promise<boolean>;
    resetPassword: (email: string) => Promise<void>; // 비밀번호 재설정 함수 추가
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
            console.error('토큰 디코딩 오류:', error);
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

            console.log('토큰 갱신 시도...');
            // 현재 세션 가져오기
            const { data, error } = await supabase.auth.getSession();
            
            if (error || !data.session) {
                console.error('세션을 가져오는 중 오류 발생:', error?.message);
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
            console.log('토큰 갱신 성공');
            return true;
        } catch (error: any) {
            console.error('토큰 새로고침 중 오류:', error.message);
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
                console.log('토큰 만료 또는 곧 만료 예정, 갱신 시도');
                return await refreshToken();
            }
            
            return true;
        } catch (error) {
            console.error('토큰 검증 중 오류:', error);
            return false;
        }
    }, [auth, decodeToken, refreshToken]);

    // 사용자 정보를 가져오는 함수
    const getUser = useCallback(async (): Promise<CustomUser | null> => {
        try {
            // 먼저 세션이 유효한지 확인
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !sessionData.session) {
                console.error('유효한 세션이 없습니다:', sessionError?.message);
                return null;
            }
            
            // 사용자 정보 가져오기
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                console.error('사용자 정보를 가져올 수 없음: ', error?.message);
                return null;
            }
            
            console.log('Auth 사용자 정보 가져옴:', user.id);
            
            try {
                // users 테이블에서 사용자 정보 조회
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select("*")
                    .eq('id', user.id)
                    .single();
                
                if (userError) {
                    console.error('사용자 데이터 조회 실패:', userError.message);
                    
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
                            
                            console.log('새 사용자 생성 시도:', newUser);
                            
                            const { data: insertData, error: insertError } = await supabase
                                .from('users')
                                .insert([newUser])
                                .select();
                                
                            if (insertError) {
                                console.error('사용자 생성 오류:', insertError.message);
                                return null;
                            }
                            
                            console.log('새 사용자 생성 성공:', insertData[0]);
                            return insertData[0] as CustomUser;
                        } catch (insertCatchError: any) {
                            console.error('사용자 생성 중 예외 발생:', insertCatchError.message);
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
                
                console.log('사용자 데이터 성공적으로 가져옴:', userData);
                return userData as CustomUser;
            } catch (error: any) {
                console.error('사용자 데이터 처리 중 오류:', error.message);
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
            console.error('getUser 함수 오류:', error.message);
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
                            console.log('세션 스토리지에서 사용자 정보 임시 복원됨');
                        }
                    } catch (cacheError) {
                        console.error('캐시된 사용자 정보 복원 오류:', cacheError);
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
                                    console.log('사용자 정보 로드 성공:', user);
                                    
                                    // 검증된 사용자 정보 캐싱
                                    try {
                                        sessionStorage.setItem('currentUser', JSON.stringify(user));
                                        sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                                    } catch (e) {
                                        console.error('캐시 저장 오류:', e);
                                    }
                                } else {
                                    // 사용자 정보가 없으면 인증 정보 제거
                                    console.warn('사용자 정보를 가져올 수 없음, 로그아웃');
                                    authHelper.removeAuth();
                                    setAuth(undefined);
                                    setCurrentUser(null);
                                    setAuthVerified(false);
                                    sessionStorage.removeItem('currentUser');
                                    sessionStorage.removeItem('lastAuthCheck');
                                }
                            } else {
                                // 토큰 갱신 실패 시 인증 정보 제거
                                console.warn('토큰 갱신 실패, 로그아웃');
                                authHelper.removeAuth();
                                setAuth(undefined);
                                setCurrentUser(null);
                                setAuthVerified(false);
                                sessionStorage.removeItem('currentUser');
                                sessionStorage.removeItem('lastAuthCheck');
                            }
                        } catch (backgroundError) {
                            console.error('백그라운드 인증 초기화 오류:', backgroundError);
                            // 오류 발생 시 인증 정보는 그대로 유지 (UI 깜빡임 방지)
                        }
                    }, 0);
                }
            } catch (error) {
                console.error('인증 초기화 오류:', error);
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
                console.log('인증 상태 변경 감지:', event);

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
                    console.log('비밀번호 변경 후 토큰 갱신됨');
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
                    console.log('인증 상태 변경 후 사용자 정보:', user);
                } else if (event === 'SIGNED_OUT') {
                    // 로그아웃 이벤트 처리
                    setAuth(undefined);
                    setCurrentUser(null);
                    authHelper.removeAuth();
                    console.log('로그아웃 감지');
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
        console.log('로그인 시도:', email);
        setLoading(true);
        
        try {
            console.log('Supabase 인증 요청 시작');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Supabase 로그인 에러:', error.message);
                console.error('에러 코드:', error.code || '코드 없음');
                console.error('에러 상세:', JSON.stringify(error));
                throw new Error(error.message);
            }

            console.log('인증 응답 데이터:', data);
            if (!data || !data.session) {
                console.error('로그인 데이터 없음');
                throw new Error('로그인 데이터가 없습니다');
            }

            console.log('Supabase 로그인 성공, 세션 획득');
            const session = data.session;
            const authData: AuthModel = {
                access_token: session.access_token,
                refreshToken: session.refresh_token,
                api_token: session.access_token
            };

            // Auth Data 저장
            saveAuth(authData);
            
            try {
                console.log('사용자 정보 가져오기 시도');
                const user = await getUser();
                console.log('사용자 정보 획득:', user);
                
                if (!user) {
                    console.error('사용자 정보가 없음');
                    throw new Error('사용자 정보를 가져올 수 없습니다.');
                }
                
                setCurrentUser(user);
                setAuthVerified(true);
                
                // 사용자 정보 캐싱
                try {
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                    sessionStorage.setItem('lastAuthCheck', Date.now().toString());
                } catch (e) {
                    console.error('캐시 저장 오류:', e);
                }
            } catch (getUserError) {
                console.error('사용자 정보 가져오기 실패:', getUserError);
                throw new Error('사용자 정보를 가져오는데 실패했습니다.');
            }
            
            return true;
        } catch (error: any) {
            console.error('로그인 실패:', error);
            // 초기화
            saveAuth(undefined);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // 비밀번호 재설정 함수 추가
    const resetPassword = async (email: string) => {
        setLoading(true);
        try {
            console.log('비밀번호 재설정 시도:', email);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            
            if (error) {
                console.error('비밀번호 재설정 오류:', error.message);
                throw new Error(error.message);
            }
            
            console.log('비밀번호 재설정 이메일 전송 성공');
        } catch (error: any) {
            console.error('비밀번호 재설정 실패:', error);
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
                console.log('이미 검증된 인증 정보, 검증 생략');
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
                        console.error('캐시 저장 오류:', e);
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
            console.error('검증 오류:', error);
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
        console.log('로그아웃 시도...');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw new Error(error.message);
            }

            console.log('로그아웃 성공');
            authHelper.removeAuth();
            setAuth(undefined);
            setCurrentUser(null);
            setAuthVerified(false);
            
            // 세션 스토리지 정리
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('lastAuthCheck');
        } catch (error: any) {
            console.error('로그아웃 실패:', error);
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
        resetPassword // 비밀번호 재설정 함수 추가
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