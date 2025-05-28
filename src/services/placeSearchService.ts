import axios, { AxiosError } from 'axios';

/**
 * 장소 검색 결과 인터페이스
 */
export interface PlaceSearchResult {
  query: string;
  adMids: string[];
  normalList: PlaceInfo[];
}

export interface PlaceInfo {
  type: string;
  name: string;
  id: string;
  visit: number;
  blog: number;
  imageCount: number;
  booking: string;
  npay: string;
  distance: string;
  category: string;
  businessCategory: string;
  categoryCodeList: string;
  rank?: number;
  isAdDup?: boolean;
  link?: string;
}

/**
 * API 상태 인터페이스
 */
export interface ApiStatus {
  isAvailable: boolean;
  error?: string;
  environment?: string;
}

/**
 * 네이버 지도 API를 사용하여 장소를 검색하는 서비스
 * 개발 및 프로덕션 환경에서 모두 사용 가능
 */
export const searchPlaceService = {
  /**
   * API 서버 URL - 환경에 따라 달라짐
   * 개발 환경: 로컬 Worker (port 9000)
   * 프로덕션 환경: /api (Cloudflare Workers)
   */
  getApiUrl(): string {
    if (import.meta.env.DEV) {
      return 'http://localhost:9000/api';
    }
    
    return '/api'; // Cloudflare에서는 동일 도메인에서 Workers가 실행됨
  },

  /**
   * API 서버 상태 확인
   * @returns API 상태 정보
   */
  async checkApiStatus(): Promise<ApiStatus> {
    try {
      // Worker 상태 확인 (ping)
      const response = await axios.get(`${this.getApiUrl()}/ping`, {
        timeout: 5000
      });

      // 개발 환경인지 확인 (Worker에서 environment 정보를 반환하는 경우)
      const environment = response.data?.environment || '알 수 없음';

      return {
        isAvailable: true,
        environment
      };
    } catch (err) {
      console.error('API 서버 연결 오류:', err);

      // 오류 유형에 따른 구체적인 메시지 제공
      let errorMessage = '네이버 지도 검색 API에 연결할 수 없습니다.';

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;

        if (axiosError.code === 'ECONNREFUSED') {
          errorMessage = 'API 서버 연결이 거부되었습니다. Worker가 실행 중인지 확인하세요. (npm run dev:worker)';
        } else if (axiosError.code === 'ECONNABORTED') {
          errorMessage = 'API 서버 연결 시간이 초과되었습니다. 네트워크 상태를 확인하세요.';
        } else if (axiosError.response) {
          errorMessage = `API 서버 오류: ${axiosError.response.status} ${axiosError.response.statusText}`;
        }
      }

      return {
        isAvailable: false,
        error: errorMessage
      };
    }
  },

  /**
   * 주어진 검색어에 대한 장소 검색을 수행
   * @param searchQuery 검색어
   * @returns 검색 결과
   */
  async searchPlace(searchQuery: string): Promise<PlaceSearchResult | null> {
    if (!searchQuery) {
      console.error('검색어가 필요합니다.');
      return null;
    }

    try {
      // API 서버를 통해 검색 요청
      const apiUrl = `${this.getApiUrl()}/search`;

      const response = await axios.get(apiUrl, {
        params: { query: searchQuery },
        timeout: 10000 // 10초 타임아웃
      });

      return response.data;
    } catch (err) {
      // 자세한 오류 로깅
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;

        if (axiosError.code === 'ECONNREFUSED') {
          console.error('API 서버 연결이 거부되었습니다. Worker가 실행 중인지 확인하세요.');
        } else if (axiosError.code === 'ECONNABORTED') {
          console.error('API 요청 시간이 초과되었습니다. 검색어가 너무 광범위하거나 네트워크가 불안정할 수 있습니다.');
        } else if (axiosError.response) {
          console.error(`API 오류: ${axiosError.response.status} ${axiosError.response.statusText}`);
          console.error('응답 데이터:', axiosError.response.data);
        } else {
          console.error('API 요청 중 오류 발생:', axiosError.message);
        }
      } else {
        console.error('장소 검색 중 알 수 없는 오류 발생:', err);
      }

      return null;
    }
  },

  /**
   * 좌표를 기반으로 주변 장소를 검색
   * @param query 검색어
   * @param longitude 경도
   * @param latitude 위도
   * @returns 검색 결과
   */
  async searchPlaceByCoordinates(
    query: string,
    longitude: string,
    latitude: string
  ): Promise<PlaceSearchResult | null> {
    if (!query || !longitude || !latitude) {
      console.error('검색어와 좌표가 모두 필요합니다.');
      return null;
    }

    try {
      // API 서버를 통해 좌표 기반 검색 요청
      const apiUrl = `${this.getApiUrl()}/places`;

      const response = await axios.get(apiUrl, {
        params: {
          query,
          x: longitude,
          y: latitude
        },
        timeout: 10000 // 10초 타임아웃
      });

      return response.data;
    } catch (err) {
      console.error('좌표 기반 장소 검색 중 오류 발생:', err);
      return null;
    }
  },

  /**
   * 주소 또는 장소명으로 좌표 검색
   * @param query 검색어 (주소 또는 장소명)
   * @returns 좌표 정보 (x: 경도, y: 위도)
   */
  async searchCoordinates(query: string): Promise<{ x: string, y: string } | null> {
    if (!query) {
      console.error('검색어가 필요합니다.');
      return null;
    }

    try {
      // API 서버를 통해 좌표 검색 요청
      const apiUrl = `${this.getApiUrl()}/location`;

      const response = await axios.get(apiUrl, {
        params: { query },
        timeout: 8000
      });

      if (response.data?.result?.point) {
        const { x, y } = response.data.result.point;
        return { x, y };
      }

      console.error('유효한 좌표 정보를 찾을 수 없습니다.');
      return null;
    } catch (err) {
      console.error('좌표 검색 중 오류 발생:', err);
      return null;
    }
  }
};

export default searchPlaceService;