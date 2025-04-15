const isMobileDevice = (): boolean => {
  const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  return isMobile;
};

const isMacDevice = (): boolean => {
  return navigator.userAgent.includes('Mac OS X');
};

const isWindowsDevice = (): boolean => {
  return navigator.userAgent.includes('Windows');
};

export { isMacDevice, isMobileDevice, isWindowsDevice };
