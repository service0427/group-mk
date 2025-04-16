/**
 * 테스트용 랜덤 이메일 주소를 생성합니다.
 * 형식: test-[월일시분초]@test.com
 * @returns {string} 생성된 랜덤 이메일 주소
 */
export const generateRandomEmail = (): string => {
  const now = new Date();
  
  // 월, 일, 시, 분, 초를 2자리 숫자로 포맷팅
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // 타임스탬프를 조합하여 이메일 생성
  return `test-${month}${day}${hours}${minutes}${seconds}@test.com`;
};

/**
 * 테스트용 기본 비밀번호를 반환합니다.
 * @returns {string} 테스트용 기본 비밀번호
 */
export const getTestPassword = (): string => {
  return 'Test123!';
};
