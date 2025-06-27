/**
 * 금액 계산을 위한 수학 유틸리티 함수들
 */

/**
 * 소수점 첫째 자리가 0.1 이상일 때만 올림하는 함수
 * JavaScript 부동소수점 오차로 인한 미세한 차이는 무시
 * 
 * @param value - 올림할 숫자
 * @returns 올림된 정수
 * 
 * @example
 * smartCeil(100.0000000001) // 100 (올림 안함)
 * smartCeil(100.1) // 101 (올림)
 * smartCeil(100.5) // 101 (올림)
 * smartCeil(100.99) // 101 (올림)
 */
export const smartCeil = (value: number): number => {
  // 소수점 부분이 0.1 이상일 때만 올림
  if (value - Math.floor(value) >= 0.1) {
    return Math.ceil(value);
  }
  return Math.floor(value);
};

/**
 * VAT 포함 금액 계산 (스마트 올림 적용)
 * 
 * @param amount - VAT 제외 금액
 * @param vatRate - VAT 비율 (기본값: 0.1 = 10%)
 * @returns VAT 포함 금액
 */
export const calculateWithVAT = (amount: number, vatRate: number = 0.1): number => {
  return smartCeil(amount * (1 + vatRate));
};

/**
 * VAT 제외 금액 계산 (스마트 올림 적용)
 * 
 * @param totalAmount - VAT 포함 금액
 * @param vatRate - VAT 비율 (기본값: 0.1 = 10%)
 * @returns VAT 제외 금액
 */
export const calculateWithoutVAT = (totalAmount: number, vatRate: number = 0.1): number => {
  return smartCeil(totalAmount / (1 + vatRate));
};