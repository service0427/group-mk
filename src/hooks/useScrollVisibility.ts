import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * 스크롤 위치에 따라 요소의 표시 여부를 관리하는 훅
 * @param options 설정 옵션
 * @returns 요소의 표시 여부 상태
 */
export const useScrollVisibility = (options: {
  /** 최상단에서도 표시 여부 (기본값: false) */
  showOnTop?: boolean;
  /** 최하단에서도 표시 여부 (기본값: true) */
  showOnBottom?: boolean;
  /** 위로 스크롤 시 표시 여부 (기본값: true) */
  showOnScrollUp?: boolean;
  /** 모바일에서만 효과 적용 여부 (기본값: true) */
  mobileOnly?: boolean;
}) => {
  // 기본 옵션 설정
  const {
    showOnTop = false,
    showOnBottom = true,
    showOnScrollUp = true,
    mobileOnly = true
  } = options;

  // 상태 및 참조 설정
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // 모바일 전용 옵션이 켜져 있고, 모바일이 아닌 경우 항상 표시
    if (mobileOnly && !isMobile) {
      setIsVisible(true);
      return;
    }

    // SPA에서 실제 스크롤되는 요소 찾기
    const mainContentElement = document.querySelector('main[role="content"]');
    const scrollElement = mainContentElement || window;
    
    // 초기 스크롤 위치 저장
    lastScrollYRef.current = scrollElement === window 
      ? window.scrollY 
      : (mainContentElement?.scrollTop || 0);
    
    // 스크롤 핸들러 함수
    function handleScroll() {
      // 현재 스크롤 위치 (메인 콘텐츠 또는 윈도우)
      const currentScrollY = scrollElement === window 
        ? window.scrollY 
        : (mainContentElement?.scrollTop || 0);
      
      // 이전 스크롤 위치
      const prevScrollY = lastScrollYRef.current;
      
      // 스크롤 방향 (true: 위로, false: 아래로)
      const isScrollingUp = currentScrollY < prevScrollY;
      
      // 화면 상단에 있는지 여부
      const isAtTop = currentScrollY < 100;
      
      // 화면 하단에 있는지 여부
      let isAtBottom = false;
      
      if (scrollElement === window) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        isAtBottom = windowHeight + currentScrollY >= documentHeight - 100;
      } else if (mainContentElement) {
        const containerHeight = mainContentElement.clientHeight;
        const scrollHeight = mainContentElement.scrollHeight;
        isAtBottom = containerHeight + currentScrollY >= scrollHeight - 100;
      }
      
      // 요소 표시 여부 결정 로직
      const shouldShow = 
        (showOnScrollUp && isScrollingUp) || 
        (showOnTop && isAtTop) || 
        (showOnBottom && isAtBottom);
      
      setIsVisible(shouldShow);
      
      // 현재 스크롤 위치를 이전 위치로 저장
      lastScrollYRef.current = currentScrollY;
    }
    
    // 스크롤 이벤트 리스너 등록
    scrollElement.addEventListener('scroll', handleScroll);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, showOnTop, showOnBottom, showOnScrollUp, mobileOnly]);

  return isVisible;
};

export default useScrollVisibility;