// 이 Worker 스크립트는 Cloudflare에서 SPA 라우팅을 처리합니다.
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// favicon 관련 요청에 대한 빈 응답 생성
function handleFavicon() {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      'Cache-Control': 'public, max-age=86400'
    }
  });
}

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // favicon 관련 요청 처리 - 빈 응답 반환하여 오류 방지
  if (url.pathname === '/favicon.ico' || url.pathname.endsWith('.ico')) {
    return handleFavicon();
  }
  
  // 정적 자산인 경우 그대로 반환
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|json|txt)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/media/') ||
    url.pathname.startsWith('/api/')
  ) {
    try {
      return await fetch(request);
    } catch (error) {
      console.error(`Error fetching asset ${url.pathname}:`, error);
      return new Response('Asset not found', { status: 404 });
    }
  }
  
  // 그 외의 모든 요청은 index.html을 반환하되 URL은 유지
  try {
    // index.html을 가져옴
    const response = await fetch(`${url.origin}/index.html`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch index.html: ${response.status}`);
    }
    
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
    console.error('Error handling request:', error);
    return new Response('Error loading the application. Please try again later.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}