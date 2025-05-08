# SPA 라우팅 해결책 가이드

이 문서는 Cloudflare Workers에서 실행되는 SPA(Single Page Application)의 라우팅 문제를 해결하기 위한 가이드입니다. 특히 새로고침 시 404 오류가 발생하는 문제에 대한 해결책을 제시합니다.

## 현재 구현: HashRouter

현재 프로젝트는 React Router의 `HashRouter`를 사용하여 SPA 라우팅 문제를 해결하고 있습니다. 이 방법의 특징은 다음과 같습니다:

### HashRouter 방식 장점

- URL에 해시(#) 기호를 사용하여 클라이언트 측에서만 라우팅을 처리
- 서버 설정이나 Cloudflare 구성에 관계없이 항상 정상 작동
- 새로고침이나 직접 URL 입력 시 404 오류가 발생하지 않음
- 배포 환경 간 일관된 작동 방식 (개발, 테스트, 프로덕션)

### 구현 방법

1. `App.tsx`에서 `BrowserRouter`를 `HashRouter`로 교체:

```tsx
// 변경 전
import { BrowserRouter } from 'react-router-dom';
// ...
<BrowserRouter
  basename="/" 
  future={{
    v7_relativeSplatPath: true,
    v7_startTransition: true
  }}
>
  {/* ... */}
</BrowserRouter>

// 변경 후
import { HashRouter } from 'react-router-dom';
// ...
<HashRouter
  future={{
    v7_relativeSplatPath: true,
    v7_startTransition: true
  }}
>
  {/* ... */}
</HashRouter>
```

2. URL 형식: `/#/경로` (예: `https://example.com/#/dashboard`)

## 대체 방법: BrowserRouter와 서버 설정

해시 기호(#)를 사용하지 않고 깔끔한 URL을 원한다면, 다음 방법을 사용할 수 있습니다. 이 방법은 더 복잡하지만 URL에서 해시 기호가 보이지 않습니다.

### 1. Cloudflare Pages 전용 설정

Cloudflare Pages를 사용하는 경우 아래 방법으로 설정할 수 있습니다:

#### a) `_routes.json` 파일 생성:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/assets/*",
    "/media/*",
    "/*.js",
    "/*.css",
    "/*.map",
    "/*.json",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.svg",
    "/*.gif",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.eot"
  ]
}
```

#### b) Cloudflare Pages 대시보드에서 설정:

1. Pages 프로젝트 설정으로 이동
2. "Settings" > "Functions" 섹션에서 "Serving" 탭을 찾습니다
3. "SPA Fallback" 옵션을 활성화합니다

### 2. Worker 스크립트 설정 (현재 프로젝트)

Cloudflare Workers를 사용하는 경우, 다음과 같이 `worker-site.js` 파일을 구성합니다:

```js
/**
 * SPA 애플리케이션을 위한 Cloudflare Worker
 * 정적 파일을 제외한 모든 요청을 index.html로 리디렉션
 */

// 캐시 제어 헤더
const htmlHeaders = {
  'Content-Type': 'text/html; charset=UTF-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// 정적 파일 확장자 목록
const STATIC_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.ico', '.json', '.txt', '.map'
];

// 정적 자산 폴더 경로
const STATIC_FOLDERS = ['/assets/', '/media/'];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * 요청 처리 핵심 함수
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 1. 정적 파일 요청 처리
  if (isStaticAsset(pathname)) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        return response;
      }
    } catch (e) {
      // 오류 처리
    }
  }

  // 2. SPA 라우팅을 위해 항상 index.html 반환
  try {
    const response = await fetch(`${url.origin}/index.html`);
    if (response.ok) {
      const body = await response.text();
      return new Response(body, {
        status: 200,
        headers: htmlHeaders
      });
    } else {
      throw new Error(`Failed to fetch index.html`);
    }
  } catch (e) {
    return new Response('Application Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * 주어진 경로가 정적 자산인지 확인
 */
function isStaticAsset(pathname) {
  const hasStaticExtension = STATIC_EXTENSIONS.some(ext => 
    pathname.toLowerCase().endsWith(ext)
  );
  
  const isInStaticFolder = STATIC_FOLDERS.some(folder => 
    pathname.startsWith(folder)
  );
  
  return hasStaticExtension || isInStaticFolder || pathname === '/favicon.ico';
}
```

### 3. Wrangler 설정

wrangler.toml 파일에서 SPA 처리를 명시적으로 활성화:

```toml
[site]
bucket = "./dist"
entry-point = "./"

[site.not_found_handling]
type = "single_page_application"
```

### 4. React Router 설정

App.tsx에서 BrowserRouter로 다시 전환:

```tsx
import { BrowserRouter } from 'react-router-dom';
// ...
<BrowserRouter
  basename="/"
  future={{
    v7_relativeSplatPath: true,
    v7_startTransition: true
  }}
>
  {/* ... */}
</BrowserRouter>
```

### 5. 자산 URL 처리

`Assets.ts`의 `toAbsoluteUrl` 함수가 절대 경로를 사용하도록 수정:

```tsx
const toAbsoluteUrl = (pathname: string): string => {
  // 경로가 없는 경우 빈 문자열 반환
  if (!pathname) return '';
  
  // URL이 이미 절대 경로인 경우
  if (pathname.startsWith('http') || pathname.startsWith('//')) {
    return pathname;
  }
  
  // 루트에서 시작하는 경로 그대로 유지
  if (pathname.startsWith('/')) {
    return pathname;
  }
  
  // 이미 상대 경로인 경우 그대로 반환
  return pathname;
};
```

### 6. Vite 설정

vite.config.ts의 base 속성이 절대 경로를 사용하도록 설정:

```typescript
export default defineConfig({
  // ...
  base: '/',
  // ...
});
```

## 두 방식 비교

| 기능 | HashRouter | BrowserRouter + Worker 설정 |
|------|------------|---------------------------|
| URL 형식 | `/#/경로` | `/경로` |
| 새로고침 안정성 | 매우 높음 | 서버 설정에 의존 |
| 구현 복잡도 | 낮음 | 높음 |
| SEO 친화적 | 낮음 | 높음 |
| 배포 환경 일관성 | 높음 | 변동 가능 |

## 추천 사항

1. **개발 및 테스트 단계**: `HashRouter` 사용 (간단하고 안정적)
2. **프로덕션 릴리스 준비**: `BrowserRouter`와 서버 설정 방식으로 전환 (더 깔끔한 URL)

## 결론

현재는 `HashRouter` 방식을 사용하여 새로고침 문제를 100% 해결하고 있습니다. 만약 URL에서 해시 기호(#)를 제거하고 싶다면, 위에 설명된 서버 설정 방식으로 전환할 수 있습니다. 다만 해당 방식은 설정이 더 복잡하고 잠재적인 문제가 발생할 가능성이 있으므로, 충분한 테스트가 필요합니다.