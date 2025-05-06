export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  
  // 정적 자산인 경우 그대로 처리
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|txt)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/media/') ||
    url.pathname.startsWith('/api/')
  ) {
    return next();
  }

  // index.html 파일 가져오기
  const indexHtmlResponse = await fetch(new URL('/index.html', url.origin));
  const indexHtml = await indexHtmlResponse.text();
  
  // 200 상태 코드로 index.html 콘텐츠 반환 (URL 변경 없음)
  return new Response(indexHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    status: 200
  });
}