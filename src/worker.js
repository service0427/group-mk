export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // 정적 자산 처리 (favicon.ico 포함)
      if (url.pathname.match(/\.(js|css|ico|png|svg|jpg|jpeg|gif|woff|woff2|ttf|eot)$/)) {
        // 직접 fetch 시도
        try {
          return await fetch(request);
        } catch (assetError) {
          console.error('Static asset fetch failed:', assetError);
          
          // favicon.ico 특별 처리
          if (url.pathname === '/favicon.ico') {
            return new Response(null, { 
              status: 204, // No Content
              headers: {
                'Cache-Control': 'public, max-age=86400'
              }
            });
          }
          
          // 다른 정적 자산 오류는 그대로 전달
          return new Response(`Asset not found: ${url.pathname}`, { status: 404 });
        }
      }
      
      // 그 외 모든 요청은 index.html로 처리
      try {
        const response = await fetch(new URL('/index.html', url.origin));
        const html = await response.text();
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      } catch (htmlError) {
        return new Response('Error loading application: ' + htmlError.message, { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    } catch (error) {
      // 오류 발생 시 기본 응답
      return new Response('Error processing request: ' + error.message, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}