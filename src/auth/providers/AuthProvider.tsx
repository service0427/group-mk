import { createContext, Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useState } from "react";
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
}

const AuthContext = createContext<AuthContextProps | null>(null);

const AuthProvider = ({children} : PropsWithChildren) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [auth, setAuth] = useState<AuthModel | undefined>();
    const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);

    // 사용자 정보를 가져오는 함수 (개선됨)
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

    // 토큰 새로고침 함수 (새로 추가)
    const refreshToken = useCallback(async (): Promise<boolean> => {
        try {
            const storeAuth = authHelper.getAuth();
            if (!storeAuth) return false;

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
            return true;
        } catch (error: any) {
            console.error('토큰 새로고침 중 오류:', error.message);
            return false;
        }
    }, []);

    // 초기 로드 시 인증 상태 확인 (개선)
    useEffect(() => {
        const initAuth = async () => {
            try {
                setLoading(true);
                const storeAuth = authHelper.getAuth();

                if (storeAuth) {
                    setAuth(storeAuth);
                    
                    // 토큰 새로고침 시도
                    const isRefreshed = await refreshToken();
                    
                    if (isRefreshed) {
                        // 사용자 정보 가져오기
                        const user = await getUser();
                        
                        if (user) {
                            setCurrentUser(user);
                            console.log('사용자 정보 로드 성공:', user);
                        } else {
                            // 사용자 정보가 없으면 인증 정보 제거
                            console.warn('사용자 정보를 가져올 수 없음, 로그아웃');
                            authHelper.removeAuth();
                            setAuth(undefined);
                        }
                    } else {
                        // 토큰 갱신 실패 시 인증 정보 제거
                        console.warn('토큰 갱신 실패, 로그아웃');
                        authHelper.removeAuth();
                        setAuth(undefined);
                    }
                }
            } catch (error) {
                console.error('인증 초기화 오류:', error);
                // 오류 발생 시 인증 정보 제거
                authHelper.removeAuth();
                setAuth(undefined);
                setCurrentUser(null);
            } finally {
                setLoading(false);
                setAuthInitialized(true);
            }
        };

        initAuth();
    }, [getUser, refreshToken]);

    // Supabase 인증 상태 변경 구독 (개선)
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

    const saveAuth = (auth:AuthModel | undefined) => {
        setAuth(auth);
        if (auth) {
            authHelper.setAuth(auth);
        } else {
            authHelper.removeAuth();
        }
    }

    const login = async (email: string, password: string) => {
        console.log('로그인 시도:', email);
        setLoading(true);
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Supabase 로그인 에러:', error.message);
                throw new Error(error.message);
            }

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
                setCurrentUser(user);
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
            // 토큰 갱신 시도
            const isRefreshed = await refreshToken();
            
            if (isRefreshed) {
                // 사용자 정보 가져오기
                const user = await getUser();
                if (user) {
                    setCurrentUser(user);
                } else {
                    // 사용자 정보가 없으면 로그아웃
                    saveAuth(undefined);
                    setCurrentUser(null);
                }
            } else {
                // 토큰 갱신 실패 시 로그아웃
                saveAuth(undefined);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('검증 오류:', error);
            saveAuth(undefined);
            setCurrentUser(null);
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
        } catch (error: any) {
            console.error('로그아웃 실패:', error);
            throw new Error(error?.message || '오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthContext.Provider
        value ={{
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
        }}>
            {children}
        </AuthContext.Provider>
    )
};

export { AuthContext, AuthProvider }