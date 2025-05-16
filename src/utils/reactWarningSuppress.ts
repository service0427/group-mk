/**
 * React 관련 경고 메시지를 숨기기 위한 유틸리티
 * 개발 환경에서만 작동하며, 불필요한 경고를 콘솔에서 제거합니다.
 */

export const suppressReactWarnings = (): void => {
  // 개발 환경에서만 실행
  if (process.env.NODE_ENV !== 'development') return;

  // 원래의 콘솔 경고 메서드 저장
  const originalConsoleWarn = console.warn;

  // 콘솔 경고 메서드 오버라이드
  console.warn = function (...args: any[]) {
    // React 관련 특정 경고 메시지 필터링
    const suppressWarnings = [
      'ReactDOM.render is no longer supported',
      'findDOMNode is deprecated',
      'Using UNSAFE_',
      'legacy context API',
      'StrictMode'
    ];

    // 전달된 인자에 억제할 경고가 포함되어 있는지 확인
    const shouldSuppress = suppressWarnings.some(warning => 
      args.some(arg => typeof arg === 'string' && arg.includes(warning))
    );

    // 억제할 경고가 아니면 원래의 콘솔 경고 메서드 호출
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };
};

export default suppressReactWarnings;