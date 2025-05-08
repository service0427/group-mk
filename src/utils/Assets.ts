// Exaxmples of usage:
//* 1. In a background image: <div style={{backgroundImage: `url('${toAbsoluteUrl('/media/misc/pattern-1.jpg')}')`}}>...
//* 2. In img tag: <img src={toAbsoluteUrl('/media/avatars/300-2.jpg')} />
const toAbsoluteUrl = (pathname: string): string => {
  // 경로가 없는 경우 빈 문자열 반환
  if (!pathname) return '';
  
  // URL이 이미 절대 경로인 경우
  if (pathname.startsWith('http') || pathname.startsWith('//')) {
    return pathname;
  }
  
  // 루트에서 시작하는 경로 그대로 유지
  if (pathname.startsWith('/')) {
    // return `.${pathname}`; // 기존 코드: 상대 경로로 변환
    return pathname; // 루트 경로 그대로 유지
  }
  
  // 이미 상대 경로인 경우 그대로 반환
  return pathname;
};

export { toAbsoluteUrl };
