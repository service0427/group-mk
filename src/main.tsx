import '@/components/keenicons/assets/styles.css';
import './styles/globals.css';
import './styles/active-parent-dot.js'; // 상위 메뉴 점 표시를 위한 JavaScript
import './styles/layout-overrides.css'; // 새로운 레이아웃 오버라이드 스타일
import './styles/auth-verification.css'; // 인증 검증 및 로딩 스타일
import './styles/logout-transition.css'; // 로그아웃 전환 개선 스타일
import './scripts/dark-mode-debug.js'; // 다크모드 z-index 문제 디버그 스크립트
import './utils/logoutSafety'; // 로그아웃 중 404 오류 방지 모듈

// 리치 텍스트 에디터 관련 스타일
import '@/components/rich-text-editor/tiptap-styles.css'; // TipTap 에디터 스타일
import '@/components/rich-text-editor/image-fix.css'; // 이미지 표시 문제 특화 해결 CSS

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

// React 경고 메시지 억제
// suppressReactWarnings 기능은 CloudFlare 배포 시 오류 발생으로 임시 제거

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ProvidersWrapper>
      <App />
    </ProvidersWrapper>
  </React.StrictMode>
);