export async function onRequest({request}) {
  // "/" 요청 시 index.html 제공
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/index.html'
    }
  });
}