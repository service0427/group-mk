import axios, { AxiosError, AxiosInstance } from 'axios';

interface KeywordData {
  relKeyword: string;
  monthlyPcQcCnt: string | number;
  monthlyMobileQcCnt: string | number;
}

interface KeywordAnalysisResult {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
  pcRatio: number;
  mobileRatio: number;
}

interface ApiConfig {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

interface ApiStatus {
  isAvailable: boolean;
  error?: string;
  environment?: string;
}

/**
 * 네이버 검색광고 API를 Cloudflare Workers를 통해 사용하는 서비스
 * CORS 문제를 해결하고 안정적인 API 호출을 제공
 */
class NaverSearchAdWorkerService {
  // 기본 API 설정
  private defaultConfig: ApiConfig = {
    apiKey: '0100000000db57c189722558fdb78bcd217cc1264ec3a6996a052fbe8acdc340355ba7184e',
    secretKey: 'AQAAAADbV8GJciVY/beLzSF8wSZOujhTQPaIWfyg+62v+W/MqA==',
    customerId: '1417905'
  };
  
  // 현재 사용 중인 설정
  private currentConfig: ApiConfig;
  
  // 전용 axios 인스턴스 (기본 헤더 없음)
  private axiosInstance: AxiosInstance;
  
  constructor() {
    this.currentConfig = { ...this.defaultConfig };
    
    // 깨끗한 axios 인스턴스 생성 (기본 설정 완전히 무시)
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      // 기본 transformRequest를 재정의하여 헤더 조작 방지
      transformRequest: [(data, headers) => {
        // Authorization 헤더가 있다면 제거
        delete headers.Authorization;
        delete headers.authorization;
        return JSON.stringify(data);
      }]
    });
  }
  
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
  }

  /**
   * API 서버 상태 확인
   */
  async checkApiStatus(): Promise<ApiStatus> {
    try {
      const response = await this.axiosInstance.get(`${this.getApiUrl()}/ping`);

      const environment = response.data?.environment || '알 수 없음';

      return {
        isAvailable: true,
        environment
      };
    } catch (err) {
      console.error('API 서버 연결 오류:', err);

      let errorMessage = '네이버 검색광고 API에 연결할 수 없습니다.';

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
  }
  
  // API 설정 변경
  setApiConfig(config: ApiConfig): void {
    this.currentConfig = { ...config };
  }
  
  // 기본 API 설정으로 복원
  resetApiConfig(): void {
    this.currentConfig = { ...this.defaultConfig };
  }

  /**
   * 키워드 분석 수행
   */
  async analyzeKeyword(keyword: string): Promise<KeywordAnalysisResult[] | null> {
    const trimmedKeyword = keyword.trim().replace(/\s/g, '');

    if (!trimmedKeyword) {
      console.error('키워드가 필요합니다.');
      return null;
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Cloudflare Workers를 통해 API 호출
        const apiUrl = `${this.getApiUrl()}/keyword-analysis`;
        
        const response = await this.axiosInstance.post(apiUrl, {
          keyword: trimmedKeyword,
          apiKey: this.currentConfig.apiKey,
          secretKey: this.currentConfig.secretKey,
          customerId: this.currentConfig.customerId
        });

        if (response.data?.keywordList?.length > 0) {
          // 모든 키워드 결과를 변환
          const results: KeywordAnalysisResult[] = response.data.keywordList.map((keywordData: KeywordData) => {
            // "< 10" 값을 1로 변환
            const pc = keywordData.monthlyPcQcCnt === '< 10' ? 1 : Number(keywordData.monthlyPcQcCnt);
            const mobile = keywordData.monthlyMobileQcCnt === '< 10' ? 1 : Number(keywordData.monthlyMobileQcCnt);
            const total = pc + mobile;

            // 비율 계산
            const pcRatio = total > 0 ? (pc / total) * 100 : 0;
            const mobileRatio = total > 0 ? (mobile / total) * 100 : 0;

            return {
              keyword: keywordData.relKeyword,
              pc,
              mobile,
              total,
              pcRatio: Math.round(pcRatio * 100) / 100,
              mobileRatio: Math.round(mobileRatio * 100) / 100,
            };
          });

          return results;
        }

        // 결과가 없으면 재시도
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError;

          if (axiosError.code === 'ECONNREFUSED') {
            console.error('API 서버 연결이 거부되었습니다. Worker가 실행 중인지 확인하세요.');
          } else if (axiosError.code === 'ECONNABORTED') {
            console.error('API 요청 시간이 초과되었습니다.');
          } else if (axiosError.response) {
            console.error(`API 오류: ${axiosError.response.status} ${axiosError.response.statusText}`);
            console.error('응답 데이터:', axiosError.response.data);
          } else {
            console.error('API 요청 중 오류 발생:', axiosError.message);
          }
        } else {
          console.error('키워드 분석 중 알 수 없는 오류 발생:', err);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        } else {
          throw err;
        }
      }
    }

    return null;
  }

  /**
   * 여러 키워드 동시 분석
   */
  async analyzeMultipleKeywords(keywords: string[]): Promise<KeywordAnalysisResult[]> {
    const allResults: KeywordAnalysisResult[] = [];

    for (const keyword of keywords) {
      const results = await this.analyzeKeyword(keyword);
      if (results) {
        allResults.push(...results);
      }
      
      // API 호출 간격 조절 (너무 빠른 요청 방지)
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return allResults;
  }
}

export const naverSearchAdWorkerService = new NaverSearchAdWorkerService();