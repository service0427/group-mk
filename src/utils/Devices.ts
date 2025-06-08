const isMobileDevice = (): boolean => {
  const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;

  // User Agent 체크
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // 터치 지원 체크
  const hasTouchScreen = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
  
  // 화면 크기 체크 (모바일 기준)
  const isMobileWidth = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  // User Agent가 모바일이거나, 터치 지원하면서 화면이 작은 경우
  return isMobileUA || (hasTouchScreen && isMobileWidth);
};

const isMacDevice = (): boolean => {
  return navigator.userAgent.includes('Mac OS X');
};

const isWindowsDevice = (): boolean => {
  return navigator.userAgent.includes('Windows');
};

export { isMacDevice, isMobileDevice, isWindowsDevice };
