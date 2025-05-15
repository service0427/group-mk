export const formatIsoDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

/**
 * ISO 날짜 문자열을 "yyyy-MM-dd HH:mm" 형식으로 포맷팅
 * @param isoDate ISO 날짜 문자열 (예: "2023-01-01T12:30:45.000Z")
 * @returns 포맷팅된 날짜 문자열 (예: "2023-01-01 12:30")
 */
export const formatDateTimeKorean = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    
    // 유효하지 않은 날짜인 경우 빈 문자열 반환
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};
