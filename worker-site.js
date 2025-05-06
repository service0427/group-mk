// 이 Worker 스크립트는 Cloudflare에서 SPA 라우팅을 처리합니다.
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // favicon.ico 요청을 media/app/favicon.ico로 리디렉션
  if (url.pathname === '/favicon.ico') {
    return fetch(new URL('/media/app/favicon.ico', url.origin));
  }
  
  // 정적 자산인 경우 그대로 반환
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|txt)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/media/') ||
    url.pathname.startsWith('/api/')
  ) {
    return fetch(request);
  }
  
  // 그 외의 모든 요청은 index.html을 반환하되 URL은 유지
  try {
    const response = await fetch(`${url.origin}/index.html`);
    
    // index.html의 내용을 가져와서 새로운 응답 생성
    const indexContent = await response.text();
    return new Response(indexContent, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error loading index.html:', error);
    return new Response('Error loading the application', {
      status: 500
    });
  }
}