// 네이버 쇼핑 순위 체크 API 서비스

interface RankingCheckResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface SingleKeywordRequest {
  keyword: string;
}

interface MultipleKeywordsRequest {
  keywords: string[];
}

const API_BASE_URL = 'http://mkt.techb.kr:3001';

/**
 * 단일 키워드 순위 체크
 */
export async function checkSingleKeywordRanking(keyword: string): Promise<RankingCheckResponse> {
  try {
    console.log(`[순위체크API] 단일 키워드 체크 시작: "${keyword}"`);
    console.log(`[순위체크API] 요청 URL: ${API_BASE_URL}/api/ranking/check`);
    
    const requestBody = { keyword };
    console.log('[순위체크API] 요청 본문:', requestBody);
    
    const response = await fetch(`${API_BASE_URL}/api/ranking/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[순위체크API] 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // API 실패 시 조용히 처리
      console.warn(`[순위체크API] ❌ 실패 (keyword: ${keyword}):`, response.status);
      return { success: false, error: `API 응답 실패: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[순위체크API] ✅ 성공 응답:`, data);
    return { success: true, data };
  } catch (error) {
    // 네트워크 오류 등도 조용히 처리
    console.error('[순위체크API] ❌ 네트워크 오류:', error);
    return { success: false, error: '네트워크 오류' };
  }
}

/**
 * 다중 키워드 순위 체크 (최대 100개)
 */
export async function checkMultipleKeywordsRanking(keywords: string[]): Promise<RankingCheckResponse> {
  try {
    // 최대 100개로 제한
    const limitedKeywords = keywords.slice(0, 100);
    
    console.log(`[순위체크API] 다중 키워드 체크 시작: ${limitedKeywords.length}개`);
    console.log(`[순위체크API] 요청 URL: ${API_BASE_URL}/api/ranking/check-multiple`);
    console.log('[순위체크API] 키워드 목록:', limitedKeywords);

    const requestBody = { keywords: limitedKeywords };
    console.log('[순위체크API] 요청 본문:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/ranking/check-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[순위체크API] 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // API 실패 시 조용히 처리
      console.warn(`[순위체크API] ❌ 다중 체크 실패:`, response.status);
      return { success: false, error: `API 응답 실패: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[순위체크API] ✅ 다중 체크 성공 응답:`, data);
    return { success: true, data };
  } catch (error) {
    // 네트워크 오류 등도 조용히 처리
    console.error('[순위체크API] ❌ 다중 체크 네트워크 오류:', error);
    return { success: false, error: '네트워크 오류' };
  }
}

/**
 * 슬롯 데이터에서 키워드 추출
 */
export function extractKeywordsFromSlot(inputData: any, fieldMapping?: any): string[] {
  const keywords: string[] = [];

  if (!inputData) {
    console.log('[순위체크API] inputData가 없습니다');
    return keywords;
  }

  console.log('[순위체크API] 키워드 추출 시작, inputData:', inputData);
  console.log('[순위체크API] fieldMapping:', fieldMapping);

  // 필드 매핑이 있으면 매핑에 따라 키워드 추출
  if (fieldMapping && fieldMapping.keyword) {
    const keywordField = fieldMapping.keyword;
    console.log(`[순위체크API] 필드 매핑 사용 - 키워드 필드: ${keywordField}`);
    
    if (inputData[keywordField]) {
      const keywordValue = inputData[keywordField];
      if (Array.isArray(keywordValue)) {
        keywords.push(...keywordValue);
        console.log('[순위체크API] 매핑된 필드에서 배열로 추출:', keywordValue);
      } else if (typeof keywordValue === 'string') {
        // JSON 파싱 시도
        try {
          const parsedKeywords = JSON.parse(keywordValue);
          if (Array.isArray(parsedKeywords)) {
            keywords.push(...parsedKeywords);
            console.log('[순위체크API] 매핑된 필드에서 JSON 파싱하여 추출:', parsedKeywords);
          } else {
            keywords.push(keywordValue);
            console.log('[순위체크API] 매핑된 필드에서 문자열로 추출:', keywordValue);
          }
        } catch (e) {
          keywords.push(keywordValue);
          console.log('[순위체크API] 매핑된 필드에서 문자열로 추출:', keywordValue);
        }
      }
    } else {
      console.log(`[순위체크API] 매핑된 키워드 필드 '${keywordField}'에 값이 없습니다`);
    }
  } else {
    console.log('[순위체크API] 필드 매핑이 없어 기본 필드에서 추출');
    
    // 기본 다양한 필드에서 키워드 추출
    if (inputData.keyword) {
      keywords.push(inputData.keyword);
      console.log('[순위체크API] keyword 필드에서 추출:', inputData.keyword);
    }
    
    if (inputData.검색어) {
      keywords.push(inputData.검색어);
      console.log('[순위체크API] 검색어 필드에서 추출:', inputData.검색어);
    }

    if (inputData.search_term) {
      keywords.push(inputData.search_term);
      console.log('[순위체크API] search_term 필드에서 추출:', inputData.search_term);
    }

    if (inputData.mainKeyword) {
      keywords.push(inputData.mainKeyword);
      console.log('[순위체크API] mainKeyword 필드에서 추출:', inputData.mainKeyword);
    }

    // keywords 배열이 있는 경우
    if (inputData.keywords) {
      if (Array.isArray(inputData.keywords)) {
        keywords.push(...inputData.keywords);
        console.log('[순위체크API] keywords 배열에서 추출:', inputData.keywords);
      } else if (typeof inputData.keywords === 'string') {
        try {
          const parsedKeywords = JSON.parse(inputData.keywords);
          if (Array.isArray(parsedKeywords)) {
            keywords.push(...parsedKeywords);
            console.log('[순위체크API] keywords 문자열 파싱하여 추출:', parsedKeywords);
          }
        } catch (e) {
          // 파싱 실패 시 문자열 그대로 사용
          keywords.push(inputData.keywords);
          console.log('[순위체크API] keywords 문자열 그대로 사용:', inputData.keywords);
        }
      }
    }

    // keyword1, keyword2, keyword3 형태의 필드들
    for (let i = 1; i <= 10; i++) {
      if (inputData[`keyword${i}`]) {
        keywords.push(inputData[`keyword${i}`]);
        console.log(`[순위체크API] keyword${i} 필드에서 추출:`, inputData[`keyword${i}`]);
      }
    }
  }

  // 중복 제거
  const uniqueKeywords = [...new Set(keywords)].filter(k => k && k.trim());
  console.log('[순위체크API] 최종 추출된 키워드 (중복 제거):', uniqueKeywords);
  
  return uniqueKeywords;
}

/**
 * 여러 슬롯의 키워드를 배치로 체크
 * 100개씩 나누어 처리
 */
export async function checkKeywordsInBatches(keywords: string[]): Promise<void> {
  if (keywords.length === 0) return;

  // 중복 제거
  const uniqueKeywords = [...new Set(keywords)];

  // 100개씩 배치로 나누어 처리
  for (let i = 0; i < uniqueKeywords.length; i += 100) {
    const batch = uniqueKeywords.slice(i, i + 100);
    await checkMultipleKeywordsRanking(batch);
    // API 응답은 로그만 남기고 무시 (실패해도 계속 진행)
  }
}