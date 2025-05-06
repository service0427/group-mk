// 루트 경로('/')를 처리하는 함수
export async function onRequest({ request }) {
  const url = new URL(request.url);
  
  // index.html 파일 가져오기
  const indexHtmlResponse = await fetch(new URL('/index.html', url.origin));
  const indexHtml = await indexHtmlResponse.text();
  
  // 200 상태 코드로 index.html 콘텐츠 반환
  return new Response(indexHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    status: 200
  });
}