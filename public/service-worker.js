// 캐시 이름 (버전 관리)
const CACHE_NAME = 'group-mk-v1';
const CHUNK_CACHE_NAME = 'group-mk-chunks-v1';

// 캐시할 정적 자산
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// 캐시 전략별 경로 패턴
const CACHE_STRATEGIES = {
  // 네트워크 우선, 실패시 캐시 (중요한 데이터)
  networkFirst: [
    /^\/api\//,
    /^\/auth\//,
  ],
  
  // 캐시 우선, 백그라운드 업데이트 (정적 자산)
  staleWhileRevalidate: [
    /\.css$/,
    /\.js$/,
    /\.png$/,
    /\.jpg$/,
    /\.svg$/,
    /\.woff2?$/,
    /\.ttf$/,
  ],
  
  // 캐시만 사용 (변하지 않는 자산)
  cacheOnly: [
    /\.(woff2?|ttf|eot|otf)$/,
    /\/media\//,
  ],
};

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && 
              cacheName !== CHUNK_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 다른 도메인은 캐시하지 않음
  if (url.origin !== location.origin) {
    return;
  }
  
  // 캐시 전략 결정
  if (matchPattern(url.pathname, CACHE_STRATEGIES.networkFirst)) {
    event.respondWith(networkFirst(request));
  } else if (matchPattern(url.pathname, CACHE_STRATEGIES.staleWhileRevalidate)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (matchPattern(url.pathname, CACHE_STRATEGIES.cacheOnly)) {
    event.respondWith(cacheOnly(request));
  } else {
    // 기본: 네트워크 우선
    event.respondWith(networkFirst(request));
  }
});

// 패턴 매칭 헬퍼
function matchPattern(path, patterns) {
  return patterns.some(pattern => pattern.test(path));
}

// 네트워크 우선 전략
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate 전략
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CHUNK_CACHE_NAME);
  const cached = await cache.match(request);
  
  // 캐시가 있으면 즉시 반환하고 백그라운드에서 업데이트
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cached || fetchPromise;
}

// 캐시 전용 전략
async function cacheOnly(request) {
  const cached = await caches.match(request);
  return cached || fetch(request).then((response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  });
}

// 메시지 리스너 (캐시 제어)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});