import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 페이지 이동 시 스크롤 위치를 최상단으로 초기화하는 컴포넌트
 * App 컴포넌트 내부에서 사용해야 합니다.
 *
 * 이 컴포넌트는 다음 영역의 스크롤을 초기화합니다:
 * 1. 윈도우(브라우저) 스크롤
 * 2. 메인 콘텐츠 영역 스크롤
 * 3. 콘텐츠 컨테이너 스크롤 (필요한 경우)
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 페이지 변경 시 처리할 함수
    const resetScrollPositions = () => {
      // 1. 브라우저 윈도우 스크롤 초기화
      window.scrollTo(0, 0);

      // 2. 메인 콘텐츠 영역(main.content) 스크롤 초기화
      // StandLayout의 main 요소 (overflow-y-auto가 적용된 요소)
      const mainContentElement = document.querySelector('main[role="content"]');
      if (mainContentElement && mainContentElement instanceof HTMLElement) {
        mainContentElement.scrollTop = 0;
      }

      // 3. 콘텐츠 컨테이너 스크롤 초기화 - 필요시 사용
      const contentContainer = document.querySelector('.content-container');
      if (contentContainer && contentContainer instanceof HTMLElement) {
        contentContainer.scrollTop = 0;
      }

      // 4. 사이드바 스크롤 초기화 (옵션)
      const sidebarElement = document.querySelector('.sidebar-content');
      if (sidebarElement && sidebarElement instanceof HTMLElement) {
        sidebarElement.scrollTop = 0;
      }

      // 5. 다른 가능한 스크롤 컨테이너도 초기화
      document.querySelectorAll('.overflow-y-auto, .overflow-auto').forEach(element => {
        if (element instanceof HTMLElement &&
            !element.classList.contains('sidebar-content') &&
            !element.closest('.sidebar')) {
          element.scrollTop = 0;
        }
      });
    };

    // 페이지 변경 시 실행
    resetScrollPositions();

    // 페이지 컨텐츠가 비동기적으로 로드되는 경우를 대비해 약간의 지연 후 한 번 더 실행
    const timeoutId = setTimeout(() => {
      resetScrollPositions();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export default ScrollToTop;