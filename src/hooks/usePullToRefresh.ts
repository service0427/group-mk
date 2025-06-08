import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false
}: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // 페이지 최상단에서만 동작 - 모든 스크롤 가능한 요소 확인
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    
    // 스크롤이 조금이라도 있으면 동작 안함
    if (scrollTop > 5) { // 5px 여유 둠
      touchStartY.current = 0;
      return;
    }
    
    // 스크롤 가능한 부모 요소가 있는지 확인
    let element = e.target as HTMLElement;
    while (element && element !== document.body) {
      if (element.scrollTop > 0) {
        touchStartY.current = 0;
        return;
      }
      element = element.parentElement as HTMLElement;
    }
    
    touchStartY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (touchStartY.current === 0) return;
    
    // 다시 한번 스크롤 위치 확인
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 5) {
      touchStartY.current = 0;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    
    touchEndY.current = e.touches[0].clientY;
    const distance = touchEndY.current - touchStartY.current;
    
    // 아래로 당기는 경우만 처리
    if (distance > 0) {
      e.preventDefault(); // 기본 스크롤 동작 방지
      setIsPulling(true);
      setPullDistance(Math.min(distance, threshold * 1.5));
    } else {
      // 위로 스크롤하는 경우 초기화
      setIsPulling(false);
      setPullDistance(0);
      touchStartY.current = 0;
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        // 오류 무시
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    touchStartY.current = 0;
    touchEndY.current = 0;
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (disabled) return;
    
    // 이벤트 리스너 등록
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    isPulling,
    pullDistance,
    isRefreshing
  };
};