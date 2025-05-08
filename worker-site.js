/**
 * SPA 애플리케이션을 위한 Cloudflare Worker
 * 정적 파일을 제외한 모든 요청을 index.html로 리디렉션하여 
 * React Router와 같은 클라이언트 사이드 라우팅이 제대로 작동하게 합니다.
 */

// 캐시 제어 헤더
const htmlHeaders = {
  'Content-Type': 'text/html; charset=UTF-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// 정적 파일 확장자 목록
const STATIC_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
  '.woff', '.woff2', '.ttf', '.eot', '.ico', '.json', '.txt', '.map'
];

// 정적 자산 폴더 경로
const STATIC_FOLDERS = ['/assets/', '/media/'];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * 요청 처리 핵심 함수
 * Cloudflare의 권장 방식에 따라 단순화된 구현
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 1. 정적 파일 요청 처리
  if (isStaticAsset(pathname)) {
    try {
      // 정적 파일을 가져옵니다
      const response = await fetch(request);
      
      // 파일이 존재하면 반환
      if (response.ok) {
        return response;
      }
    } catch (e) {
      // 오류 처리
    }
  }

  // 2. SPA 라우팅을 위해 항상 index.html 반환
  try {
    // index.html을 가져옵니다
    const response = await fetch(`${url.origin}/index.html`);
    
    if (response.ok) {
      // 응답 본문을 가져옵니다
      const body = await response.text();
      
      // 200 상태 코드로 index.html 반환
      return new Response(body, {
        status: 200,
        headers: htmlHeaders
      });
    } else {
      throw new Error(`Failed to fetch index.html: ${response.status}`);
    }
  } catch (e) {
    return new Response('Application Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * 주어진 경로가 정적 자산인지 확인
 */
function isStaticAsset(pathname) {
  // 확장자로 확인
  const hasStaticExtension = STATIC_EXTENSIONS.some(ext => 
    pathname.toLowerCase().endsWith(ext)
  );
  
  // 경로로 확인
  const isInStaticFolder = STATIC_FOLDERS.some(folder => 
    pathname.startsWith(folder)
  );
  
  return hasStaticExtension || isInStaticFolder || pathname === '/favicon.ico';
}