/**
 * 랭킹 변화 데이터를 생성하는 유틸리티 함수
 */

/**
 * 순위대별 일일 순위 변화 데이터를 생성합니다.
 * @param days 데이터를 생성할 일수
 * @param isHighRank 상위 순위(30위 이상) 여부
 * @returns 순위 변화 데이터 배열 (일별)
 */
export const generateRankingData = (days: number = 30, isHighRank: boolean = true): number[] => {
  const data: number[] = [];
  
  // 초기값: 현재 순위
  // 높은 순위(30위 이상)는 1~30, 낮은 순위(30위 이하)는 30~50 사이의 값
  let currentRank = isHighRank 
    ? 10 + Math.floor(Math.random() * 15) // 10~25 범위의 상위 순위
    : 35 + Math.floor(Math.random() * 10); // 35~45 범위의 하위 순위
  
  // 이전 시점의 순위 변화량 (초기값 0)
  let previousChange = 0;
  
  // 상위 순위와 하위 순위의 변동성과 평균 상승치 차별화
  const variance = isHighRank ? 3 : 2;
  const upwardBias = isHighRank ? 1.5 : 0.8; // 상위 순위가 더 높은 상승치를 가짐
  
  for (let i = 0; i < days; i++) {
    // 랜덤 값 생성 시 상승 편향을 줌 (음수가 상승, 양수가 하락을 의미)
    const rankChange = (Math.random() * (variance * 2) - variance - upwardBias);
    
    // 하락 확률 (25%, 하락은 순위가 증가하는 것)
    const isDecreasing = Math.random() < 0.25;
    
    let newRankChange;
    
    if (isDecreasing) {
      // 하락일 경우 (순위 수치가 증가)
      newRankChange = Math.abs(rankChange) * 0.5; // 하락폭은 상승폭보다 작게
    } else {
      // 상승일 경우 (순위 수치가 감소)
      newRankChange = -Math.abs(rankChange);
    }
    
    // 이전 변화량과 새 변화량을 결합하여 연속성 부여
    const smoothingFactor = 0.3;
    const smoothedChange = previousChange * smoothingFactor + newRankChange * (1 - smoothingFactor);
    
    // 현재 순위 업데이트
    currentRank = currentRank + smoothedChange;
    
    // 범위 제한 (1~30 또는 30~50)
    if (isHighRank) {
      // 상위 순위는 1~30으로 제한
      currentRank = Math.max(1, Math.min(30, currentRank));
    } else {
      // 하위 순위는 30~50으로 제한
      currentRank = Math.max(30, Math.min(50, currentRank));
    }
    
    // 1등에 가까워지면 변화 속도 감소 (1등 유지 효과)
    if (currentRank <= 3) {
      previousChange = smoothedChange * 0.5;
    } else {
      previousChange = smoothedChange;
    }
    
    // 현재 순위를 그대로 저장 (실제 등수 값)
    // 값을 소수점 첫째 자리까지 반올림하여 저장
    data.push(Number(currentRank.toFixed(1)));
  }
  
  return data;
};

/**
 * 날짜 생성 함수
 * @param days 데이터를 생성할 일수
 * @returns 날짜 배열
 */
export const generateDates = (days: number = 30): string[] => {
  // 날짜 배열 생성 (오늘부터 days일 전까지)
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // M월 D일 형식으로 날짜 추가
    const month = date.getMonth() + 1;
    const day = date.getDate();
    dates.push(`${month}월 ${day}일`);
  }
  
  return dates;
};

/**
 * 순위 변화 데이터를 생성합니다.
 * @param days 데이터를 생성할 일수
 * @returns { upperRank: 30위 이상 데이터, lowerRank: 30위 이하 데이터, dates: 날짜 배열 }
 */
export const generateRankingChangeData = (days: number = 30) => {
  const upperRank = generateRankingData(days, true);
  const lowerRank = generateRankingData(days, false);
  const dates = generateDates(days);
  
  return {
    upperRank,
    lowerRank,
    dates
  };
};

/**
 * 필터링된 기간에 따른 랭킹 변화 데이터를 생성합니다.
 * @param period 기간(7, 14, 30)
 * @returns 필터링된 순위 변화 데이터
 */
export const getFilteredRankingData = (period: number = 30) => {
  // 요청된 기간에 맞는 데이터를 직접 생성
  return generateRankingChangeData(period);
};

/**
 * 차트 데이터 통계를 계산합니다.
 * @param data 데이터 배열
 * @returns { min, max, avg, bestImprovement } 최소값, 최대값, 평균값, 최고 상승폭
 */
export const calculateDataStats = (data: number[]) => {
  if (data.length === 0) return { min: 0, max: 0, avg: 0, bestImprovement: 0 };
  
  // 0을 제외한 최소값을 찾기 위한 필터링
  const nonZeroData = data.filter(val => val > 0);
  const min = nonZeroData.length > 0 ? Math.min(...nonZeroData) : 0;
  const max = Math.max(...data);
  const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  // 최고 상승폭 계산 (연속된 두 데이터 포인트 간의 최대 등수 상승)
  let bestImprovement = 0;
  
  for (let i = 1; i < data.length; i++) {
    // 이전 데이터 대비 상승폭 계산 (등수는 작을수록 좋으므로 이전값 - 현재값이 양수면 상승)
    const improvement = data[i-1] - data[i];
    
    // 상승한 경우만 고려
    if (improvement > 0 && improvement > bestImprovement) {
      bestImprovement = improvement;
    }
  }
  
  return {
    min: Number(min.toFixed(1)),
    max: Number(max.toFixed(1)),
    avg: Number(avg.toFixed(1)),
    bestImprovement: Number(bestImprovement.toFixed(1))
  };
};