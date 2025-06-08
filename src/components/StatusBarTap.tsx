import React, { useEffect } from 'react';
import { useMediaQuery } from '@/hooks';

/**
 * 모바일 상태바 영역 탭 시 최상단으로 스크롤하는 컴포넌트
 * iOS/Android의 상태바 탭 동작을 웹에서 구현
 */
export const StatusBarTap: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // 모든 환경에서 작동하도록 변경
    const handleClick = (e: MouseEvent) => {
      const y = e.clientY;
      
      // 화면 최상단 30px 이내 클릭
      if (y <= 30) {
        const target = e.target as HTMLElement;
        
        // body나 html을 직접 클릭했거나, 빈 영역을 클릭한 경우
        if (target === document.body || 
            target === document.documentElement ||
            target.tagName === 'MAIN' ||
            (!target.closest('button') && 
             !target.closest('a') && 
             !target.closest('input') && 
             !target.closest('textarea') && 
             !target.closest('select'))) {
          
          // 현재 스크롤 위치 확인
          const mainContent = document.querySelector('main[role="content"]');
          
          if (mainContent && mainContent.scrollTop > 0) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (window.pageYOffset > 0 || document.documentElement.scrollTop > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          
          e.preventDefault();
        }
      }
    };

    // 이벤트 등록
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isMobile]);

  return null;
};