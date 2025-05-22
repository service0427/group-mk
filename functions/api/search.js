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
  const searchQuery = url.searchParams.get('query');
  
  if (!searchQuery) {
    return new Response(JSON.stringify({ error: '검색어(query) 파라미터가 필요합니다.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // 1. 좌표 추출
    const locResponse = await fetch('https://map.naver.com/p/api/location', {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
      }
    });
    
    if (!locResponse.ok) {
      throw new Error(`Location API returned status ${locResponse.status}`);
    }
    
    const locData = await locResponse.json();
    
    let longitude, latitude;
    if (locData && locData.result && locData.result.point) {
      longitude = locData.result.point.x || locData.result.point.longitude;
      latitude = locData.result.point.y || locData.result.point.latitude;
    } else if (locData && locData.coord) {
      longitude = locData.coord.x || locData.coord.longitude;
      latitude = locData.coord.y || locData.coord.latitude;
    } else {
      longitude = '126.671329';
      latitude = '37.639775';
    }
    
    // 2. HTML 요청
    const display = 70;
    const timestamp = Date.now();
    const placesUrl = `https://pcmap.place.naver.com/place/list?query=${encodedQuery}&x=${longitude}&y=${latitude}&clientX=${longitude}&clientY=${latitude}&display=${display}&ts=${timestamp}&additionalHeight=76&locale=ko&mapUrl=https%3A%2F%2Fmap.naver.com%2Fp%2Fsearch%2F${encodedQuery}`;
    
    const htmlResponse = await fetch(placesUrl, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "ko-KR,ko;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Referer": `https://map.naver.com/p/search/${encodedQuery}?c=11.00,0,0,0,dh`
      }
    });
    
    if (!htmlResponse.ok) {
      throw new Error(`HTML request returned status ${htmlResponse.status}`);
    }
    
    const html = await htmlResponse.text();
    
    const apolloStateMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/);
    
    if (!apolloStateMatch || !apolloStateMatch[1]) {
      throw new Error('window.__APOLLO_STATE__ 데이터를 찾을 수 없습니다.');
    }
    
    let apolloStateData = JSON.parse(apolloStateMatch[1]);
    
    // 데이터 분류 및 가공
    let placeInfoList = [];
    Object.entries(apolloStateData).forEach(([key, value]) => {
      if (value && typeof value.__typename === 'string' &&
        (value.__typename.endsWith('Summary') || value.__typename.endsWith('AdSummary'))) {
        
        let rawType = value.__typename;
        rawType = rawType.replace('ListSummary', '').replace('Summary', '').replace('Ad', 'Ad');
        
        const typeMap = {
          Place: '떡집(Place)',
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
    
    // 응답 JSON 구조
    return new Response(JSON.stringify({
      query: searchQuery,
      adMids,
      normalList: normalListWithDup
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error(`Search error: ${err.message}`);
    
    // 오류 시 빈 결과 반환
    return new Response(JSON.stringify({
      query: searchQuery,
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