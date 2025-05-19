export async function onRequest(context) {
  // API 요청 처리
  const response = await context.next();
  
  // API 경로인 경우에만 CORS 헤더 추가
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/')) {
    // 기존 헤더 복사
    const newResponse = new Response(response.body, response);
    
    // CORS 헤더 추가
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return newResponse;
  }
  
  return response;
}