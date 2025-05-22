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
  const longitude = url.searchParams.get('x') || '126.671329';
  const latitude = url.searchParams.get('y') || '37.639775';
  
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
    const display = 70;
    const timestamp = Date.now();
    
    const placesUrl = `https://pcmap.place.naver.com/place/list?query=${encodedQuery}&x=${longitude}&y=${latitude}&clientX=${longitude}&clientY=${latitude}&display=${display}&ts=${timestamp}&additionalHeight=76&locale=ko&mapUrl=https%3A%2F%2Fmap.naver.com%2Fp%2Fsearch%2F${encodedQuery}`;
    
    const response = await fetch(placesUrl, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "ko-KR,ko;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Places API returned status ${response.status}`);
    }
    
    const html = await response.text();
    
    // APOLLO_STATE 데이터 추출
    const apolloStateMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/);
    
    if (!apolloStateMatch || !apolloStateMatch[1]) {
      throw new Error('APOLLO_STATE 데이터를 찾을 수 없습니다.');
    }
    
    // JSON 파싱 처리
    let apolloStateData = JSON.parse(apolloStateMatch[1]);
    
    // 데이터 가공
    let placeInfoList = [];
    Object.entries(apolloStateData).forEach(([key, value]) => {
      if (value && typeof value.__typename === 'string' &&
        (value.__typename.endsWith('Summary') || value.__typename.endsWith('AdSummary'))) {
        
        let rawType = value.__typename;
        rawType = rawType.replace('ListSummary', '').replace('Summary', '').replace('Ad', 'Ad');
        
        const typeMap = {
          Place: '플레이스(Place)',
          Restaurant: '맛집(Restaurant)',
          Hospital: '병원(Hospital)',
          Beauty: '미용(Beauty)',
          Attraction: '관광(Attraction)',
          RestaurantAd: '맛집광고(RestaurantAd)',
          HospitalAd: '병원광고(HospitalAd)',
          BeautyAd: '미용광고(BeautyAd)',
          AttractionAd: '관광광고(AttractionAd)'
        };
        
        const type = typeMap[rawType] || rawType;
        const name = value.name || '이름 없음';
        const id = value.id || '-';
        const visit = value.visitorReviewCount || 0;
        const blog = value.blogCafeReviewCount || 0;
        const imageCount = value.imageCount || 0;
        const booking = value.hasBooking ? 'Y' : 'N';
        const npay = value.hasNPay ? 'Y' : 'N';
        const distance = value.distance || 'N/A';
        const category = value.category || '-';
        const businessCategory = value.businessCategory || '-';
        const categoryCodeList = Array.isArray(value.categoryCodeList)
          ? value.categoryCodeList.join(',')
          : '-';
        
        placeInfoList.push({
          type, name, id, visit, blog, imageCount, booking, npay,
          distance, category, businessCategory, categoryCodeList
        });
      }
    });
    
    // 광고/일반 분리 및 광고 MID 추출
    const isAd = (type) => type.endsWith('Ad') || type.includes('광고');
    const adList = placeInfoList.filter(p => isAd(p.type));
    const adMids = adList.map(p => p.id);
    const normalList = placeInfoList.filter(p => !isAd(p.type));
    
    // 일반 리스트에서 광고와 중복 체크 및 순위 부여
    const normalListWithDup = normalList.map((place, idx) => ({
      ...place,
      rank: idx + 1,
      isAdDup: adMids.includes(place.id)
    }));
    
    // 결과 반환
    return new Response(JSON.stringify({
      query,
      adMids,
      normalList: normalListWithDup
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error(`API error: ${error.message}`);
    
    // 오류 시 빈 결과 반환
    return new Response(JSON.stringify({
      query,
      adMids: [],
      normalList: []
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}