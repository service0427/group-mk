// 이 Worker 스크립트는 Cloudflare에서 SPA 라우팅을 처리합니다.
addEventListener('fetch', event => {
  try {
    event.respondWith(handleRequest(event.request));
  } catch (error) {
    event.respondWith(new Response('Error processing request', { status: 500 }));
  }
});

// 현재 환경 정보 (wrangler.jsonc의 env에서 설정됨)
const ENVIRONMENT = typeof ENVIRONMENT !== 'undefined' ? ENVIRONMENT : 'production';

// 환경에 따른 로깅 설정
console.log(`Worker running in ${ENVIRONMENT} environment`);

// 단순화된 worker 스크립트 - 500 오류 방지
async function handleRequest(request) {
  const url = new URL(request.url);

  // favicon.ico 요청에 대한 빈 응답 반환
  if (url.pathname === '/favicon.ico') {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'public, max-age=86400' }
    });
  }

  // 정적 파일 패턴 (이것들은 직접 처리)
  const staticFilePattern = /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|txt|ico)$/;
  const isStaticFile = url.pathname.match(staticFilePattern) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/media/');

  if (isStaticFile) {
    try {
      // 정적 파일 요청 처리
      const response = await fetch(request);
      // 파일이 없으면 404 반환
      if (response.status === 404 && url.pathname.endsWith('.ico')) {
        // favicon.ico 파일 특별 처리
        return new Response(null, {
          status: 204,
          headers: { 'Cache-Control': 'public, max-age=86400' }
        });
      }
      return response;
    } catch (error) {
      // 정적 파일을 가져오지 못한 경우
      console.error(`Failed to fetch static file: ${url.pathname}`, error);
      if (url.pathname.endsWith('.ico')) {
        return new Response(null, { status: 204 });
      }
      // 정적 파일은 404 응답을 그대로 반환
      return new Response('File not found', { status: 404 });
    }
  }

  // SPA 라우트 처리 - 항상 index.html 제공
  try {
    // index.html 요청
    const indexReq = new Request(`${url.origin}/index.html`, {
      method: 'GET',
      headers: request.headers
    });

    const response = await fetch(indexReq);

    if (response.status === 200) {
      const indexContent = await response.text();
      return new Response(indexContent, {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } else {
      // index.html이 없는 경우 404 반환
      return new Response('Not found', { status: 404 });
    }
  } catch (error) {
    // 예외 발생 시 500 에러 반환
    return new Response('Server error', { status: 500 });
  }
}