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

  // 나머지 모든 요청은 /index.html로 처리 (SPA 라우팅)
  try {
    const response = await next();
    if (response.status === 404) {
      return next({ mapRequestToAsset: (req) => new Request(`${url.origin}/index.html`, req) });
    }
    return response;
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}