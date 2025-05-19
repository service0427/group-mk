export async function onRequest(context) {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const url = new URL(context.request.url);
  const query = url.searchParams.get('query');

  if (!query) {
    return new Response(JSON.stringify({ error: '검색어가 필요합니다.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    
    // 네이버 위치 API 호출
    const response = await fetch('https://map.naver.com/p/api/location', {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Location API returned status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error(`API error: ${error.message}`);
    
    // 기본 좌표 반환 (오류 발생 시)
    return new Response(JSON.stringify({
      result: {
        point: {
          x: "126.671329",
          y: "37.639775"
        }
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}