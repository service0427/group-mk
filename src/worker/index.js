addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 정적 파일 요청인 경우 그대로 반환
  if (url.pathname.match(/\.(js|css|png|jpg|gif|svg|ico|json|txt|woff|woff2|ttf|eot)$/)) {
    return fetch(request)
  }
  
  // 특정 경로는 그대로 반환
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/media/')) {
    return fetch(request)
  }
  
  // 그 외의 모든 요청은 index.html로 리디렉션
  try {
    const response = await fetch(`${url.origin}/index.html`)
    return response
  } catch (error) {
    return new Response('Error loading the app', { status: 500 })
  }
}