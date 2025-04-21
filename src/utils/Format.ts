/**
 * 금액을 원 단위로 포맷팅하는 함수
 * @param amount 포맷팅할 금액
 * @returns 포맷팅된 금액 문자열 (예: 10,000원)
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0원';
  
  // 문자열인 경우 숫자로 변환
  const numAmount = typeof amount === 'string' ? parseInt(amount.replace(/[^\d]/g, '')) : amount;
  
  // 숫자를 천 단위 콤마로 포맷팅
  return `${numAmount.toLocaleString('ko-KR')}원`;
};

/**
 * 금액을 만원 단위로 포맷팅하는 함수
 * @param amount 포맷팅할 금액
 * @returns 포맷팅된 금액 문자열 (예: 1만원)
 */
export const formatCurrencyInTenThousand = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0원';
  
  // 문자열인 경우 숫자로 변환
  const numAmount = typeof amount === 'string' ? parseInt(amount.replace(/[^\d]/g, '')) : amount;
  
  // 만원 단위로 변환
  const inTenThousand = numAmount / 10000;
  
  if (inTenThousand < 1) {
    // 만원 미만은 그대로 표시
    return `${numAmount.toLocaleString('ko-KR')}원`;
  } else if (Number.isInteger(inTenThousand)) {
    // 정수인 경우 (예: 10000 -> 1만원)
    return `${inTenThousand.toLocaleString('ko-KR')}만원`;
  } else {
    // 소수점이 있는 경우 (예: 15000 -> 1.5만원)
    // 소수점 첫째 자리까지만 표시하고 불필요한 0 제거
    const formatted = inTenThousand.toFixed(1).replace(/\.0$/, '');
    return `${formatted}만원`;
  }
};
