export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // favicon.ico 요청 처리: 단순 204 응답 반환
    if (url.pathname === '/favicon.ico') {
      return new Response(null, { 
        status: 204,
        headers: { 'Cache-Control': 'public, max-age=86400' }
      });
    }
    
    // 기타 정적 파일 요청
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
      return fetch(request);
    }
    
    // 그 외 모든 경로는 index.html로 처리
    const response = await fetch(new URL('/index.html', url.origin));
    return new Response(await response.text(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}