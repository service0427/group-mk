// Cloudflare Worker - Naver Map API Proxy
/**
 * Map API 요청을 처리하는 Cloudflare Worker
 * Express 서버 대신 Cloudflare에서 작동할 수 있도록 구현
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 목(mock) 데이터 - 실제 API 호출 실패 시 사용할 테스트 데이터
const MOCK_DATA = {
  query: "맛집",
  adMids: ["11111", "22222", "33333"],
  normalList: [
    {
      type: "맛집(Restaurant)",
      name: "테스트 레스토랑 1",
      id: "12345",
      visit: 150,
      blog: 50,
      imageCount: 25,
      booking: "O",
      npay: "O",
      distance: "1.2km",
      category: "한식",
      businessCategory: "음식점",
      categoryCodeList: "restaurant,korean",
      rank: 1,
      isAdDup: false
    },
    {
      type: "맛집(Restaurant)",
      name: "테스트 레스토랑 2",
      id: "23456",
      visit: 120,
      blog: 40,
      imageCount: 18,
      booking: "-",
      npay: "O",
      distance: "1.5km",
      category: "양식",
      businessCategory: "음식점",
      categoryCodeList: "restaurant,western",
      rank: 2,
      isAdDup: false
    },
    {
      type: "카페(Cafe)",
      name: "테스트 카페",
      id: "34567",
      visit: 80,
      blog: 30,
      imageCount: 15,
      booking: "-",
      npay: "-",
      distance: "0.8km",
      category: "카페,디저트",
      businessCategory: "카페",
      categoryCodeList: "cafe,dessert",
      rank: 3,
      isAdDup: true
    }
  ]
};

// 개발 환경인지 여부를 확인
// true: 목업 데이터 사용, false: 실제 네이버 API 호출
// 배포 환경에서도 목업 데이터를 사용하도록 true로 설정
const isDevEnvironment = true;

/**
 * 요청 핸들러
 * @param {Request} request 클라이언트 요청
 * @returns {Promise<Response>} 응답
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  console.log(`[Worker] Received request for ${url.pathname}`);
  
  // CORS 헤더 설정 - 더 많은 헤더와 메서드 허용
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // 간단한 ping 요청 처리 (서버 상태 확인용)
    if (url.pathname === '/api/ping') {
      console.log('[Worker] Handling ping request from: ' + request.headers.get('origin') || 'unknown');
      console.log('[Worker] Request URL: ' + url.toString());
      console.log('[Worker] Worker Mode: ' + (isDevEnvironment ? 'Mock Data' : 'Real API'));
      
      // 응답 데이터
      const responseData = { 
        status: 'ok',
        environment: isDevEnvironment ? 'development' : 'production',
        mockData: isDevEnvironment,
        timestamp: new Date().toISOString(),
        worker_url: url.toString(),
        request_headers: Object.fromEntries([...request.headers])
      };
      
      console.log('[Worker] Sending ping response:', JSON.stringify(responseData));
      
      return new Response(JSON.stringify(responseData), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // API 요청 처리
    if (url.pathname.startsWith('/api/')) {
      console.log(`[Worker] Processing API request: ${url.pathname}`);
      
      // 개발 환경이고 모의 데이터 사용이 활성화된 경우 모의 데이터 반환
      if (isDevEnvironment) {
        if (url.pathname === '/api/search') {
          console.log('[Worker] Returning mock data for search request');
          
          // 검색어에 따라 데이터 변형 (테스트용)
          const query = url.searchParams.get('query') || '테스트';
          const mockData = JSON.parse(JSON.stringify(MOCK_DATA)); // 깊은 복사
          mockData.query = query;
          
          // 검색어를 이름에 추가
          mockData.normalList = mockData.normalList.map(item => ({
            ...item,
            name: `${item.name} (${query})`
          }));
          
          return new Response(JSON.stringify(mockData), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } else if (url.pathname === '/api/location') {
          console.log('[Worker] Returning mock location data');
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
        } else if (url.pathname === '/api/places') {
          console.log('[Worker] Returning mock places data');
          return new Response(JSON.stringify(MOCK_DATA), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
      } else {
        // 실제 API 호출 시도
        try {
          if (url.pathname === '/api/search') {
            return await handleSearchRequest(request, url, corsHeaders);
          } else if (url.pathname === '/api/location') {
            return await handleLocationRequest(request, url, corsHeaders);
          } else if (url.pathname === '/api/places') {
            return await handlePlacesRequest(request, url, corsHeaders);
          }
        } catch (apiError) {
          console.error(`[Worker] API call failed: ${apiError.message}`);
          console.error(apiError.stack);
          
          // API 오류 시 모의 데이터로 대체
          console.log('[Worker] Falling back to mock data due to API error');
          
          if (url.pathname === '/api/search') {
            const query = url.searchParams.get('query') || '테스트';
            const mockData = JSON.parse(JSON.stringify(MOCK_DATA));
            mockData.query = query;
            mockData.normalList = mockData.normalList.map(item => ({
              ...item,
              name: `${item.name} (${query}) - 모의 데이터`
            }));
            
            return new Response(JSON.stringify(mockData), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          } else if (url.pathname === '/api/location') {
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
          } else if (url.pathname === '/api/places') {
            return new Response(JSON.stringify(MOCK_DATA), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
        }
      }
      
      // 지원하지 않는 API 경로
      console.log(`[Worker] Unsupported API path: ${url.pathname}`);
      return new Response(JSON.stringify({ error: '지원하지 않는 API 경로입니다.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // API 경로가 아닌 경우 404 반환
    console.log(`[Worker] Not an API path: ${url.pathname}`);
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    console.error(`[Worker] Unhandled error: ${error.message}`);
    console.error(error.stack);
    return new Response(JSON.stringify({ 
      error: '서버 내부 오류가 발생했습니다.', 
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

/**
 * 네이버 위치 API 요청 처리
 * @param {Request} request 원본 요청
 * @param {URL} url 요청 URL
 * @param {Object} corsHeaders CORS 헤더
 * @returns {Promise<Response>} 응답
 */
async function handleLocationRequest(request, url, corsHeaders) {
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
    console.log(`[Worker] Fetching location for query: ${query}`);
    
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
    console.error(`[Worker] Location API error: ${error.message}`);
    throw error;
  }
}

/**
 * 네이버 장소 검색 API 요청 처리
 * @param {Request} request 원본 요청
 * @param {URL} url 요청 URL
 * @param {Object} corsHeaders CORS 헤더
 * @returns {Promise<Response>} 응답
 */
async function handlePlacesRequest(request, url, corsHeaders) {
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
    console.log(`[Worker] Fetching places for query: ${query}, coordinates: ${longitude},${latitude}`);
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
      console.error('[Worker] APOLLO_STATE data not found');
      throw new Error('APOLLO_STATE 데이터를 찾을 수 없습니다.');
    }
    
    // JSON 파싱 처리
    let apolloStateData;
    try {
      apolloStateData = JSON.parse(apolloStateMatch[1]);
    } catch (parseError) {
      console.error(`[Worker] APOLLO_STATE parsing error: ${parseError.message}`);
      throw new Error('APOLLO_STATE 데이터 파싱 오류');
    }
    
    // 데이터 가공
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
        const booking = value.hasBooking ? 'O' : '-';
        const npay = value.hasNPay ? 'O' : '-';
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
    console.error(`[Worker] Places API error: ${error.message}`);
    throw error;
  }
}

/**
 * 통합 검색 API 처리
 * @param {Request} request 원본 요청
 * @param {URL} url 요청 URL
 * @param {Object} corsHeaders CORS 헤더
 * @returns {Promise<Response>} 응답
 */
async function handleSearchRequest(request, url, corsHeaders) {
  const searchQuery = url.searchParams.get('query');
  console.log(`[Worker] Processing search request for query: ${searchQuery}`);
  
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
    console.log(`[Worker] Fetching coordinates for: ${searchQuery}`);
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
    console.log(`[Worker] Location API response received`);
    
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
    
    console.log(`[Worker] Using coordinates: ${longitude}, ${latitude}`);
    
    // 2. HTML 요청
    const display = 70;
    const timestamp = Date.now();
    const placesUrl = `https://pcmap.place.naver.com/place/list?query=${encodedQuery}&x=${longitude}&y=${latitude}&clientX=${longitude}&clientY=${latitude}&display=${display}&ts=${timestamp}&additionalHeight=76&locale=ko&mapUrl=https%3A%2F%2Fmap.naver.com%2Fp%2Fsearch%2F${encodedQuery}`;
    
    console.log(`[Worker] Fetching HTML content from Naver Places`);
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
    console.log(`[Worker] HTML content received, length: ${html.length}`);
    
    const apolloStateMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/);
    
    if (!apolloStateMatch || !apolloStateMatch[1]) {
      console.error('[Worker] APOLLO_STATE not found in HTML');
      throw new Error('window.__APOLLO_STATE__ 데이터를 찾을 수 없습니다.');
    }
    
    let apolloStateData;
    try {
      console.log(`[Worker] Parsing APOLLO_STATE data`);
      apolloStateData = JSON.parse(apolloStateMatch[1]);
    } catch (parseError) {
      console.error(`[Worker] Failed to parse APOLLO_STATE: ${parseError.message}`);
      throw new Error('APOLLO_STATE 데이터 파싱 오류');
    }
    
    // 데이터 분류 및 가공
    console.log(`[Worker] Processing place data`);
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
        const booking = value.hasBooking ? 'O' : '-';
        const npay = value.hasNPay ? 'O' : '-';
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
    
    console.log(`[Worker] Found ${normalListWithDup.length} places`);
    
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
    console.error(`[Worker] Search error: ${err.message}`);
    console.error(err.stack);
    throw err;
  }
}