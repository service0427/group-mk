import { User as Auth0UserModel } from '@auth0/auth0-spa-js';

import { type AuthModel } from './_models';

// 더 이상 localStorage에 저장하지 않음
const getAuth = (): AuthModel | undefined => {
  // 항상 undefined 반환 (메모리에서만 관리)
  return undefined;
};

const setAuth = (auth: AuthModel | Auth0UserModel) => {
  // localStorage에 저장하지 않음 (no-op)
};

const removeAuth = () => {
  // localStorage에서 제거할 것이 없음 (no-op)
};

export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = 'application/json';
  axios.interceptors.request.use(
    (config: { headers: { Authorization: string } }) => {
      const auth = getAuth();

      if (auth?.access_token) {
        config.headers.Authorization = `Bearer ${auth.access_token}`;
      }

      return config;
    },
    async (err: any) => await Promise.reject(err)
  );
}

export { getAuth, removeAuth, setAuth };
