/**
 * 모바일 최적화 유틸리티
 * - URL 주소창 자동 숨김
 * - 전체 화면 높이 설정
 */

import { isMobileDevice } from './Devices';

// 동적 viewport 높이 설정
export const setDynamicViewportHeight = () => {
  // 실제 viewport 높이 계산
  const vh = window.innerHeight * 0.01;
  // CSS 변수로 설정
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // dvh 지원 확인 및 폴백
  if (!CSS.supports('height', '100dvh')) {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  }
};

// URL 주소창 숨김 - 모바일 브라우저에서만 작동
export const hideAddressBar = () => {
  if (!isMobileDevice()) return;
  
  // viewport 메타 태그 설정만 유지
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
};

// 모바일 최적화 초기화
export const initMobileOptimizations = () => {
  if (!isMobileDevice()) {
    return;
  }
  
  // 초기 viewport 높이 설정
  setDynamicViewportHeight();
  
  // 주소창 숨김
  hideAddressBar();
  
  // resize 이벤트 리스너 추가
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setDynamicViewportHeight();
    }, 100);
  });
  
  // orientation change 이벤트 리스너
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      setDynamicViewportHeight();
      hideAddressBar();
    }, 200);
  });
  
  // 페이지 로드 완료 시 다시 시도
  window.addEventListener('load', () => {
    hideAddressBar();
  });
  
  
};

// Safe area 패딩 적용
export const applySafeAreaPadding = (element: HTMLElement) => {
  if (!CSS.supports('padding-top', 'env(safe-area-inset-top)')) return;
  
  element.style.paddingTop = 'env(safe-area-inset-top)';
  element.style.paddingBottom = 'env(safe-area-inset-bottom)';
  element.style.paddingLeft = 'env(safe-area-inset-left)';
  element.style.paddingRight = 'env(safe-area-inset-right)';
};