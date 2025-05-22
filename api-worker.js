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
      booking: "Y",
      npay: "Y",
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
      booking: "N",
      npay: "Y",
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
      booking: "N",
      npay: "N",
      distance: "0.8km",
      category: "카페,디저트",
      businessCategory: "카페",
      categoryCodeList: "cafe,dessert",
      rank: 3,
      isAdDup: true
    }
  ]
};

// 쇼핑 검색 목(mock) 데이터
const MOCK_SHOP_DATA = {
  lastBuildDate: "Wed, 08 Nov 2023 17:00:00 +0900",
  total: 100,
  display: 3,
  items: [
    {
      rank: 1,
      title: "기정떡 1kg",
      link: "https://shopping.naver.com/gate.nhn?id=123456",
      image: "https://shopping-phinf.pstatic.net/test1.jpg",
      lprice: "15000",
      hprice: "20000",
      mallName: "테스트 쇼핑몰",
      productId: "123456",
      productType: "1",
      brand: "기정떡",
      maker: "기정떡집",
      category1: "식품",
      category2: "떡류",
      category3: "기정떡",
      category4: ""
    },
    {
      rank: 2,
      title: "기정떡 500g",
      link: "https://shopping.naver.com/gate.nhn?id=234567",
      image: "https://shopping-phinf.pstatic.net/test2.jpg",
      lprice: "8000",
      hprice: "12000",
      mallName: "떡 전문점",
      productId: "234567",
      productType: "1",
      brand: "기정떡",
      maker: "전통떡집",
      category1: "식품",
      category2: "떡류",
      category3: "기정떡",
      category4: ""
    },
    {
      rank: 3,
      title: "기정떡 선물세트",
      link: "https://shopping.naver.com/gate.nhn?id=345678",
      image: "https://shopping-phinf.pstatic.net/test3.jpg",
      lprice: "25000",
      hprice: "30000",
      mallName: "전통식품몰",
      productId: "345678",
      productType: "1",
      brand: "기정떡",
      maker: "한국떡집",
      category1: "식품",
      category2: "떡류",
      category3: "기정떡",
      category4: ""
    }
  ]
};

// 네이버 쇼핑 API 설정
const SHOP_CONFIG = {
  apiKeys: [
    { client_id: 'BQlzqihxYt4JAZL_mUgF', client_secret: 'R9vsA7070H' },
    { client_id: 'DRuTTVdcIb88OtHCVP8t', client_secret: 'fb110n9dq8' },
    { client_id: 'lnCKjiOaDDweBgYhQwsw', client_secret: '09jUejcs37' }
  ],
  baseUrl: 'https://openapi.naver.com/v1/search/shop',
  maxItemsLimit: 300,
  defaultDisplay: 100,
  defaultQuery: '기정떡'
};

// 개발 환경인지 여부를 확인
// true: 목업 데이터 사용, false: 실제 네이버 API 호출
// 실제 API 호출을 위해 false로 설정
const isDevEnvironment = false;

/**
 * 요청 핸들러
 * @param {Request} request 클라이언트 요청
 * @returns {Promise<Response>} 응답
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
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

      // 응답 데이터
      const responseData = { 
        status: 'ok',
        environment: isDevEnvironment ? 'development' : 'production',
        mockData: isDevEnvironment,
        timestamp: new Date().toISOString(),
        worker_url: url.toString(),
        request_headers: Object.fromEntries([...request.headers])
      };
      
      return new Response(JSON.stringify(responseData), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // API 요청 처리
    if (url.pathname.startsWith('/api/')) {
      
      // 개발 환경이고 모의 데이터 사용이 활성화된 경우 모의 데이터 반환
      if (isDevEnvironment) {
        if (url.pathname === '/api/search') {
          
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
        } else if (url.pathname === '/api/shop') {
          
          const query = url.searchParams.get('query') || SHOP_CONFIG.defaultQuery;
          const mockShopData = JSON.parse(JSON.stringify(MOCK_SHOP_DATA));
          
          // 검색어에 따라 상품명 변경
          mockShopData.items = mockShopData.items.map(item => ({
            ...item,
            title: `${query} ${item.title.split(' ').slice(-1)[0]}`
          }));
          
          return new Response(JSON.stringify(mockShopData), {
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
          } else if (url.pathname === '/api/shop') {
            return await handleShopRequest(request, url, corsHeaders);
          }
        } catch (apiError) {
          console.error(`[Worker] API call failed: ${apiError.message}`);
          console.error(apiError.stack);
                    
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
          } else if (url.pathname === '/api/shop') {
            const query = url.searchParams.get('query') || SHOP_CONFIG.defaultQuery;
            const mockShopData = JSON.parse(JSON.stringify(MOCK_SHOP_DATA));
            mockShopData.items = mockShopData.items.map(item => ({
              ...item,
              title: `${query} ${item.title.split(' ').slice(-1)[0]} - 모의 데이터`
            }));
            
            return new Response(JSON.stringify(mockShopData), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
        }
      }
      
      // 지원하지 않는 API 경로
      return new Response(JSON.stringify({ error: '지원하지 않는 API 경로입니다.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // API 경로가 아닌 경우 404 반환
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
      console.error('[Worker] APOLLO_STATE not found in HTML');
      throw new Error('window.__APOLLO_STATE__ 데이터를 찾을 수 없습니다.');
    }
    
    let apolloStateData;
    try {
      apolloStateData = JSON.parse(apolloStateMatch[1]);
    } catch (parseError) {
      console.error(`[Worker] Failed to parse APOLLO_STATE: ${parseError.message}`);
      throw new Error('APOLLO_STATE 데이터 파싱 오류');
    }
    
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
    console.error(`[Worker] Search error: ${err.message}`);
    console.error(err.stack);
    throw err;
  }
}

/**
 * 네이버 쇼핑 검색 API 요청 처리
 * @param {Request} request 원본 요청
 * @param {URL} url 요청 URL
 * @param {Object} corsHeaders CORS 헤더
 * @returns {Promise<Response>} 응답
 */
async function handleShopRequest(request, url, corsHeaders) {
  const searchParams = parseShopSearchParams(url);
  const apiKey = getRandomShopApiKey();
  
  try {
    const searchResult = await fetchShopItems(searchParams, apiKey);
    
    return new Response(JSON.stringify(searchResult), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error(`[Worker] Shop API error: ${error.message}`);
    throw error;
  }
}

/**
 * 쇼핑 검색 파라미터 파싱
 */
function parseShopSearchParams(url) {
  const query = url.searchParams.get('query') || SHOP_CONFIG.defaultQuery;
  const limit = Math.min(
    parseInt(url.searchParams.get('limit')) || SHOP_CONFIG.defaultDisplay,
    SHOP_CONFIG.maxItemsLimit
  );
  
  return { query, limit };
}

/**
 * 랜덤하게 쇼핑 API 키 선택
 */
function getRandomShopApiKey() {
  const randomIndex = Math.floor(Math.random() * SHOP_CONFIG.apiKeys.length);
  return SHOP_CONFIG.apiKeys[randomIndex];
}

/**
 * 쇼핑 아이템 검색
 */
async function fetchShopItems(searchParams, apiKey) {
  const { query, limit } = searchParams;
  let allItems = [];
  let start = 1;
  
  // 첫 페이지 요청
  const firstPageResult = await fetchShopPage({
    query,
    start,
    display: Math.min(SHOP_CONFIG.defaultDisplay, limit),
    apiKey
  });
  
  // 전체 아이템 수 확인
  const totalItems = parseInt(firstPageResult.total);
  const itemsToFetch = Math.min(totalItems, limit);
  
  // 첫 페이지 결과 처리
  allItems = processShopItems(firstPageResult.items, start);
  
  // 나머지 페이지 요청 (필요한 경우)
  await fetchRemainingShopPages({
    query,
    apiKey,
    itemsToFetch,
    totalItems,
    allItems
  });
  
  // 결과 검증
  validateShopResults(allItems, totalItems);
  
  // 결과 데이터 구성
  return formatShopResults(firstPageResult, totalItems, allItems, itemsToFetch);
}

/**
 * 나머지 쇼핑 페이지 요청
 */
async function fetchRemainingShopPages({ query, apiKey, itemsToFetch, totalItems, allItems }) {
  let start = SHOP_CONFIG.defaultDisplay + 1;
  
  while (allItems.length < itemsToFetch && allItems.length < totalItems && start <= itemsToFetch) {
    const remainingItems = Math.min(itemsToFetch - allItems.length, SHOP_CONFIG.defaultDisplay);
    
    const pageResult = await fetchShopPage({
      query,
      start,
      display: remainingItems,
      apiKey
    });
    
    if (!pageResult.items || pageResult.items.length === 0) {
      break;
    }
    
    // 결과 처리 및 태그 제거 후 추가
    const processedItems = processShopItems(pageResult.items, start);
    allItems.push(...processedItems);
    
    start += SHOP_CONFIG.defaultDisplay;
  }
}

/**
 * 쇼핑 결과 검증
 */
function validateShopResults(allItems, totalItems) {
  if (allItems.length > totalItems) {
    throw new Error(`가져온 아이템 수(${allItems.length})가 전체 아이템 수(${totalItems})보다 많습니다!`);
  }
}

/**
 * 쇼핑 결과 포맷팅
 */
function formatShopResults(firstPageResult, totalItems, allItems, itemsToFetch) {
  return {
    lastBuildDate: firstPageResult.lastBuildDate,
    total: totalItems,
    display: allItems.length,
    items: allItems.slice(0, itemsToFetch)
  };
}

/**
 * 단일 쇼핑 페이지 요청
 */
async function fetchShopPage({ query, start, display, apiKey }) {
  const api_url = `${SHOP_CONFIG.baseUrl}?query=${encodeURI(query)}&start=${start}&display=${display}`;
  
  const headers = {
    'X-Naver-Client-Id': apiKey.client_id,
    'X-Naver-Client-Secret': apiKey.client_secret
  };
  
  try {
    const response = await fetch(api_url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * 쇼핑 아이템 처리 및 태그 제거
 */
function processShopItems(items, startIndex) {
  return items.map((item, index) => {
    // 순위 정보 추가
    const rank = startIndex + index;
    
    // 모든 문자열 필드에서 HTML 태그 제거
    const cleanedItem = cleanShopItemTags(item);
    
    // 순위 정보 추가
    return {
      rank,
      ...cleanedItem
    };
  });
}

/**
 * 쇼핑 아이템의 모든 문자열 필드에서 HTML 태그 제거
 */
function cleanShopItemTags(item) {
  const cleanedItem = {};
  
  Object.keys(item).forEach(key => {
    if (typeof item[key] === 'string') {
      cleanedItem[key] = stripShopTags(item[key]);
    } else {
      cleanedItem[key] = item[key];
    }
  });
  
  return cleanedItem;
}

/**
 * HTML 태그 제거 (쇼핑용)
 */
function stripShopTags(str) {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '');
}