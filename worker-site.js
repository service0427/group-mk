// 이 Worker 스크립트는 Cloudflare에서 SPA 라우팅을 처리합니다.
addEventListener('fetch', event => {
  try {
    event.respondWith(handleRequest(event.request));
  } catch (error) {
    event.respondWith(new Response('Error processing request', { status: 500 }));
  }
});

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
    // 예비 HTML - 실제 index.html을 가져오지 못할 경우 대체 콘텐츠
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>마케팅의 정석 :: The standard of Marketing</title>
        <meta http-equiv="refresh" content="3;url=${url.origin}">
        <style>
          body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                 display: flex; height: 100vh; margin: 0; align-items: center; justify-content: center; text-align: center; }
          div { max-width: 800px; padding: 20px; }
          h1 { color: #3498db; }
        </style>
      </head>
      <body>
        <div>
          <h1>마케팅의 정석</h1>
          <p>페이지를 로드하는 중입니다...</p>
        </div>
      </body>
      </html>
    `;

    // index.html 요청
    try {
      const indexReq = new Request(`${url.origin}/index.html`, {
        method: 'GET',
        headers: request.headers
      });
      
      const response = await fetch(indexReq);
      
      if (response.status === 200) {
        const indexContent = await response.text();
        
        // URL에 따라 동적 메타 태그 추가 (SEO 개선)
        // let processedContent = indexContent;
        // 여기서 필요하다면 동적 메타 태그 처리 코드 추가 가능
        
        return new Response(indexContent, {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      } else {
        console.error(`Failed to fetch index.html: ${response.status}`);
        // 인덱스를 가져올 수 없는 경우 대체 HTML 반환
        return new Response(fallbackHtml, {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        });
      }
    } catch (fetchError) {
      console.error(`Error fetching index.html:`, fetchError);
      return new Response(fallbackHtml, {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }
  } catch (error) {
    // 예외 발생 시 대체 HTML 반환 (항상 200 응답)
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>일시적인 오류</title>
        <meta http-equiv="refresh" content="3;url=${url.origin}">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 20px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>일시적인 오류가 발생했습니다</h1>
        <p>잠시 후 자동으로 새로고침됩니다...</p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      status: 200 // 오류 발생해도 200 반환하여 사용자 경험 개선
    });
  }
}