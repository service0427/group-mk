/**
 * Cloudflare Pages Function - 네이버 쇼핑 검색 API
 * 
 * 기능:
 * - 네이버 쇼핑 API를 통해 상품 검색
 * - HTML 태그 제거
 * - 순위 정보 추가
 * - 페이징 처리
 * - 랜덤 API 키 사용
 */

// 상수 정의
const MAX_ITEMS_LIMIT = 300;
const DEFAULT_DISPLAY = 100;
const DEFAULT_QUERY = '기정떡';

/**
 * API 설정
 */
const config = {
  // API 인증 정보 (여러 쌍의 API 키)
  apiKeys: [
    { client_id: 'BQlzqihxYt4JAZL_mUgF', client_secret: 'R9vsA7070H' },
    { client_id: 'DRuTTVdcIb88OtHCVP8t', client_secret: 'fb110n9dq8' },
    { client_id: 'lnCKjiOaDDweBgYhQwsw', client_secret: '09jUejcs37' }
  ],
  baseUrl: 'https://openapi.naver.com/v1/search/shop'
};

export async function onRequest(context) {
  const { request } = context;
  
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Max-Age': '86400',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(request.url);
    const searchParams = parseSearchParams(url);
    const apiKey = getRandomApiKey();
    const searchResult = await fetchShopItems(searchParams, apiKey);
    
    return new Response(JSON.stringify(searchResult), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    return handleApiError(error, corsHeaders);
  }
}

/**
 * 검색 파라미터 파싱
 */
function parseSearchParams(url) {
  const query = url.searchParams.get('query') || DEFAULT_QUERY;
  const limit = Math.min(
    parseInt(url.searchParams.get('limit')) || DEFAULT_DISPLAY, 
    MAX_ITEMS_LIMIT
  );
  
  return { query, limit };
}

/**
 * 랜덤하게 API 키 선택
 */
function getRandomApiKey() {
  const randomIndex = Math.floor(Math.random() * config.apiKeys.length);
  return config.apiKeys[randomIndex];
}

/**
 * API 에러 처리
 */
function handleApiError(error, corsHeaders) {
  console.error('API 요청 중 오류 발생:', error.message);
  
  return new Response(JSON.stringify({
    error: '네이버 쇼핑 API 요청 중 오류가 발생했습니다.',
    message: error.message,
    status: error.response ? error.response.status : null,
    data: error.response ? error.response.data : null
  }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * 쇼핑 아이템 검색
 */
async function fetchShopItems(searchParams, apiKey) {
  const { query, limit } = searchParams;
  let allItems = [];
  let start = 1;
  
  // 첫 페이지 요청
  const firstPageResult = await fetchPage({
    query,
    start,
    display: Math.min(DEFAULT_DISPLAY, limit),
    apiKey
  });
  
  // 전체 아이템 수 확인
  const totalItems = parseInt(firstPageResult.total);
  const itemsToFetch = Math.min(totalItems, limit);
  
  // 첫 페이지 결과 처리
  allItems = processItems(firstPageResult.items, start);
  
  // 나머지 페이지 요청 (필요한 경우)
  await fetchRemainingPages({
    query,
    apiKey,
    itemsToFetch,
    totalItems,
    allItems
  });
  
  // 결과 검증
  validateResults(allItems, totalItems);
  
  // 결과 데이터 구성
  return formatResults(firstPageResult, totalItems, allItems, itemsToFetch);
}

/**
 * 나머지 페이지 요청
 */
async function fetchRemainingPages({ query, apiKey, itemsToFetch, totalItems, allItems }) {
  let start = DEFAULT_DISPLAY + 1;
  
  while (allItems.length < itemsToFetch && allItems.length < totalItems && start <= itemsToFetch) {
    const remainingItems = Math.min(itemsToFetch - allItems.length, DEFAULT_DISPLAY);
    
    const pageResult = await fetchPage({
      query,
      start,
      display: remainingItems,
      apiKey
    });
    
    if (!pageResult.items || pageResult.items.length === 0) {
      break;
    }
    
    // 결과 처리 및 태그 제거 후 추가
    const processedItems = processItems(pageResult.items, start);
    allItems.push(...processedItems);
    
    start += DEFAULT_DISPLAY;
  }
}

/**
 * 결과 검증
 */
function validateResults(allItems, totalItems) {
  if (allItems.length > totalItems) {
    throw new Error(`가져온 아이템 수(${allItems.length})가 전체 아이템 수(${totalItems})보다 많습니다!`);
  }
}

/**
 * 결과 포맷팅
 */
function formatResults(firstPageResult, totalItems, allItems, itemsToFetch) {
  return {
    lastBuildDate: firstPageResult.lastBuildDate,
    total: totalItems,
    display: allItems.length,
    items: allItems.slice(0, itemsToFetch)
  };
}

/**
 * 단일 페이지 요청
 */
async function fetchPage({ query, start, display, apiKey }) {
  const api_url = `${config.baseUrl}?query=${encodeURI(query)}&start=${start}&display=${display}`;
  
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
 * 아이템 처리 및 태그 제거
 */
function processItems(items, startIndex) {
  return items.map((item, index) => {
    // 순위 정보 추가
    const rank = startIndex + index;
    
    // 모든 문자열 필드에서 HTML 태그 제거
    const cleanedItem = cleanItemTags(item);
    
    // 순위 정보 추가
    return {
      rank,
      ...cleanedItem
    };
  });
}

/**
 * 아이템의 모든 문자열 필드에서 HTML 태그 제거
 */
function cleanItemTags(item) {
  const cleanedItem = {};
  
  Object.keys(item).forEach(key => {
    if (typeof item[key] === 'string') {
      cleanedItem[key] = stripTags(item[key]);
    } else {
      cleanedItem[key] = item[key];
    }
  });
  
  return cleanedItem;
}

/**
 * HTML 태그 제거
 */
function stripTags(str) {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '');
}