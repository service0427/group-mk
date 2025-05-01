import '@/components/keenicons/assets/styles.css';
import './styles/globals.css';
import './styles/active-parent-dot.js'; // 상위 메뉴 점 표시를 위한 JavaScript
import './styles/layout-overrides.css'; // 새로운 레이아웃 오버라이드 스타일
import './styles/auth-verification.css'; // 인증 검증 및 로딩 스타일

import axios from 'axios';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import { setupAxios } from './auth';
import { ProvidersWrapper } from './providers';
import React from 'react';

/**
 * Inject interceptors for axios.
 *
 * @see https://github.com/axios/axios#interceptors
 */
setupAxios(axios);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ProvidersWrapper>
      <App />
    </ProvidersWrapper>
  </React.StrictMode>
);