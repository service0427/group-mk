// 서비스 워커 등록 유틸리티

export function register() {
  if ('serviceWorker' in navigator) {
    // 프로덕션 환경에서만 서비스 워커 활성화
    if (import.meta.env.PROD) {
      window.addEventListener('load', () => {
        const swUrl = '/service-worker.js';
        registerValidSW(swUrl);
      });
    }
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker 등록 성공');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 새 콘텐츠가 있음을 사용자에게 알림
              console.log('새로운 콘텐츠가 있습니다. 새로고침해주세요.');
              
              // 자동으로 새 서비스 워커 활성화
              if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            } else {
              console.log('콘텐츠가 오프라인 사용을 위해 캐시되었습니다.');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Service Worker 등록 실패:', error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}