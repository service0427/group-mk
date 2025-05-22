# 네이버 지도 검색 API 통합

이 문서는 네이버 지도 API를 사용한 장소 검색 기능 구현에 대한 설명입니다.

## 구현 방식

Cloudflare Workers를 사용한 서버리스 방식으로 구현되었습니다:

- Cloudflare Workers를 통해 네이버 지도 API 요청을 처리
- 클라이언트 CORS 제한을 우회하여 네이버 지도 API를 안전하게 사용
- React+TypeScript 기반의 UI 구현
- 개발 환경과 배포 환경 모두에서 원활하게 동작

## 환경 설정

### 개발 환경 설정

로컬 개발 환경에서는 Vite와 Wrangler를 함께 실행합니다:

```bash
# 전체 개발 환경 시작 (React 앱 + Cloudflare Worker)
npm run dev

# 또는 개별적으로 실행:
# React 앱만 실행
npm run dev:app

# Worker만 실행
npm run dev:worker
```

이 명령은 다음 작업을 수행합니다:
1. React 앱을 5173 포트에서 실행
2. Cloudflare Worker를 9000 포트에서 실행

### 배포 환경 설정

Cloudflare Pages 및 Workers를 사용하여 전체 애플리케이션을 배포합니다:

```bash
# 테스트 환경에 배포
npm run deploy:test

# 프로덕션 환경에 배포
npm run deploy:prod
```

## API 구현 방식

### 1. 서버 프록시 패턴

네이버 지도 API에 직접 접근할 수 없는 CORS 제한을 우회하기 위해 Cloudflare Worker가 프록시 서버 역할을 합니다.

### 2. Mock 데이터 지원

API 호출에 실패하거나 개발 모드에서 작동할 때 `api-worker.js`는 모의 데이터를 반환합니다.

```javascript
// api-worker.js에서 설정
const isDevEnvironment = true;  // true로 설정하면 항상 모의 데이터 사용
```

### 3. 오류 처리 및 회복

API 호출 실패 시 모의 데이터로 자동 대체되어 안정적인 UI 테스트가 가능합니다.

## API 엔드포인트

### 1. 상태 확인 API
```
GET /api/ping
```
Worker의 상태를 확인합니다. 정상 응답 시 `{status: 'ok'}`를 반환합니다.

### 2. 위치(좌표) API
```
GET /api/location?query={검색어}
```
위치 정보(좌표)를 가져옵니다.

**응답 예시:**
```json
{
  "result": {
    "point": {
      "x": "126.671329",
      "y": "37.639775"
    }
  }
}
```

### 3. 장소 검색 API
```
GET /api/places?query={검색어}&x={경도}&y={위도}
```
특정 좌표 주변의 장소를 검색합니다.

**응답 예시:**
```json
{
  "query": "맛집",
  "adMids": ["12345", "67890"],
  "normalList": [
    {
      "type": "맛집(Restaurant)",
      "name": "테스트 레스토랑",
      "id": "12345",
      "visit": 150,
      "blog": 50,
      "imageCount": 25,
      "booking": "O",
      "npay": "O",
      "distance": "1.2km",
      "category": "한식",
      "businessCategory": "음식점",
      "categoryCodeList": "restaurant,korean",
      "rank": 1,
      "isAdDup": false
    }
  ]
}
```

### 4. 통합 검색 API
```
GET /api/search?query={검색어}
```
위치 정보 조회 후 해당 위치 주변의 장소를 검색하는 통합 API입니다.

## 관련 파일 구조

```
/api/
  ├── README.md  # 이 문서
/api-worker.js  # Cloudflare Worker 구현
/worker-site.js  # SPA 라우팅 Worker
/wrangler.toml  # 배포용 설정
/wrangler-dev.toml  # 개발용 설정
/src/
  ├── services/
  │   └── placeSearchService.ts  # 검색 API 서비스
  ├── pages/
  │   └── SearchPage.tsx  # 검색 페이지 컴포넌트
```

## 사용 방법

### 1. SearchPage 컴포넌트

`/map-search` 경로에서 접근할 수 있으며, 메뉴에 "장소 검색" 항목으로 등록되어 있습니다.

### 2. 프로그래밍 방식 사용

```typescript
import searchPlaceService from '@/services/placeSearchService';

// API 상태 확인
const apiStatus = await searchPlaceService.checkApiStatus();

// 장소 검색
const searchResults = await searchPlaceService.searchPlace('서울 맛집');

// 좌표 검색
const coordinates = await searchPlaceService.searchCoordinates('서울시청');

// 좌표 기반 검색
const nearbyPlaces = await searchPlaceService.searchPlaceByCoordinates(
  '맛집',
  '126.977948', // 경도
  '37.566338'   // 위도
);
```

## 주의사항

1. 네이버 지도 API는 공식 API가 아니라 네이버 지도 웹사이트의 API를 역공학해서 사용하는 방식이므로, 네이버 측에서 API 변경 시 작동하지 않을 수 있습니다.

2. CORS 정책으로 인해 클라이언트에서 직접 API를 호출할 수 없으므로 Cloudflare Workers를 사용해 프록시합니다.

3. 배포 환경에서 네이버 API 호출이 원활하지 않을 경우 `api-worker.js`의 `isDevEnvironment` 값을 `true`로 설정하여 모의 데이터를 사용하도록 할 수 있습니다.

## 문제 해결

### 로컬 개발 환경 문제

개발 환경에서 "API 서비스에 연결할 수 없습니다" 메시지가 표시되는 경우:

1. Worker가 실행 중인지 확인 (`npm run dev:worker`)
2. Worker가 9000 포트에서 실행 중인지 확인
3. `npm run dev`로 React 앱과 Worker를 모두 재시작

### Cloudflare Workers 배포 오류

Cloudflare 배포 시 오류가 발생하는 경우:

1. `wrangler.toml` 설정 확인
2. Cloudflare 대시보드에서 로그 확인
3. 로컬 환경에서 Workers 테스트: `npm run dev:worker`

### API 응답 오류

실제 네이버 API 응답이 예상과 다른 경우:

1. `api-worker.js`에서 `isDevEnvironment = true`로 설정하여 모의 데이터 사용
2. 콘솔 로그에서 오류 메시지 확인
3. 네트워크 탭에서 API 응답 분석