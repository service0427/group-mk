// 날짜 포맷팅 유틸리티 함수

/**
 * Date를 yyyy-MM-dd 형식으로 변환
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Invalid date check
    if (isNaN(dateObj.getTime())) return '-';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Date를 한국어 형식으로 변환 (yyyy년 MM월 dd일)
 */
export const formatDateKorean = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Invalid date check
    if (isNaN(dateObj.getTime())) return '-';
    
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    return `${year}년 ${month}월 ${day}일`;
  } catch (error) {
    return '-';
  }
};