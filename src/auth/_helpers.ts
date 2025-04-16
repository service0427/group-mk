import { User as Auth0UserModel } from '@auth0/auth0-spa-js';
import { getData, setData } from '@/utils';
import { type AuthModel } from './_models';

// 로컬스토리지 키 상수
export const AUTH_LOCAL_STORAGE_KEY = `${import.meta.env.VITE_APP_NAME}-auth-v${
  import.meta.env.VITE_APP_VERSION
}`;
export const USER_PREFERENCES_KEY = 'user_preferences';
export const SESSION_KEY = 'supabase.auth.token';

// JWT 인증 시스템 도우미 함수
export function getAuth(): AuthModel | undefined {
  try {
    const auth = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY);
    if (!auth) return undefined;
    
    const parsedAuth = JSON.parse(auth);
    // 필수 필드 검증
    if (!parsedAuth.access_token || !parsedAuth.api_token) {
      console.warn('Invalid auth data structure');
      removeAuth();
      return undefined;
    }
    
    return parsedAuth;
  } catch (error) {
    console.error('Auth parse error:', error);
    removeAuth();
    return undefined;
  }
}

export function setAuth(auth: AuthModel) {
  if (!auth.access_token || !auth.api_token) {
    console.error('Invalid auth data');
    return;
  }
  localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, JSON.stringify(auth));
}

export function removeAuth() {
  localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
}

// Axios를 설정하여 JWT 인증 토큰을 사용하도록 함
export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = 'application/json';
  axios.interceptors.request.use(
    async (config: { headers: { Authorization: string } }) => {
      const auth = getAuth();
      if (auth?.access_token) {
        config.headers.Authorization = `Bearer ${auth.access_token}`;
      }
      return config;
    },
    async (err: any) => await Promise.reject(err)
  );
}

// 로컬스토리지 헬퍼 함수들
export const clearAuthData = () => {
  removeAuth();
  localStorage.removeItem(USER_PREFERENCES_KEY);
};

export const setUserPreference = (key: string, value: any) => {
  const preferences = getUserPreferences();
  preferences[key] = value;
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
};

export const getUserPreferences = () => {
  try {
    const data = localStorage.getItem(USER_PREFERENCES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Preferences parse error:', error);
    return {};
  }
};

export const getAuthToken = (): string | undefined => {
  const auth = getAuth();
  return auth?.access_token;
};

export const setAuthToken = (token: string) => {
  if (!token) {
    console.error('Invalid token');
    return;
  }
  const auth = getAuth();
  setAuth({
    access_token: token,
    api_token: auth?.api_token || '',
    refreshToken: auth?.refreshToken
  });
};
