import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IToolbarProps } from './types';
import { useMediaQuery } from '@/hooks';

interface StyledToolbarProps {
  bgClass?: string;
  textClass?: string;
  title: string;
  description?: string;
  hideDescription?: boolean;
  toolbarActions?: React.ReactNode;
  children?: React.ReactNode;
  sticky?: boolean; // sticky 기능 활성화 여부
}

/**
 * 대시보드 스타일의 툴바 컴포넌트
 * 색상 배경과 그라데이션을 적용한 스타일로 표시됨
 */
const StyledToolbar: React.FC<StyledToolbarProps> = ({ 
  bgClass = 'bg-gradient-to-r from-primary to-info',
  textClass = 'text-white', 
  title,
  description,
  hideDescription = false,
  toolbarActions,
  children,
  sticky = true // 기본값으로 sticky 활성화
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // 툴바 클릭 시 최상단으로 스크롤
  const handleToolbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 빈 영역을 클릭했을 때만 동작 (버튼이나 링크 클릭은 제외)
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || 
        (!target.closest('button') && !target.closest('a') && !target.closest('input'))) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Portal container 생성
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalContainer(document.body);
    }
  }, []);


  useEffect(() => {
    // 모바일에서만 sticky 기능 작동
    if (!sticky || !isMobile) return;

    const mainContent = document.querySelector('main[role="content"]');
    if (!mainContent) return;

    const handleScroll = () => {
      if (!containerRef.current || !mainContent) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollTop = mainContent.scrollTop;
      
      // 헤더와 공지사항 높이
      const headerHeight = 60;
      const noticeHeight = document.querySelector('.notice-marquee')?.clientHeight || 36;
      const fixedElementsHeight = headerHeight + noticeHeight;
      
      // 스크롤이 최상단인지 확인
      const isAtTop = scrollTop <= 0;
      
      // 툴바가 보이는 위치인지 확인 (툴바의 top이 고정 요소들보다 아래에 있으면 보임)
      const isToolbarVisible = containerRect.top >= fixedElementsHeight;
      
      // Sticky 해제: 최상단이거나 툴바가 보이는 위치일 때
      if ((isAtTop || isToolbarVisible) && isSticky) {
        setIsSticky(false);
      }
      // Sticky 활성화: 툴바가 완전히 가려졌을 때
      else if (containerRect.bottom <= fixedElementsHeight && !isAtTop && !isSticky) {
        setIsSticky(true);
      }
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    
    // 초기 실행
    handleScroll();

    return () => {
      mainContent.removeEventListener('scroll', handleScroll);
    };
  }, [sticky, isMobile, isSticky]); // isSticky 의존성 추가

  // 일반 툴바 렌더링
  const renderToolbar = (isFixed = false) => (
    <div 
      className={`${bgClass} ${textClass} shadow-md px-5 py-5 ${!isFixed ? 'mb-3 rounded-lg' : ''} dark:shadow-none Toolbar transition-all duration-300 cursor-pointer ${
        isFixed ? 'fixed left-0 right-0 z-20 shadow-lg px-4 py-3' : ''
      }`}
      style={isFixed ? {
        top: `${60 + (document.querySelector('.notice-marquee')?.clientHeight || 36)}px`,
      } : {}}
      onClick={handleToolbarClick}
    >
      <div className={`flex ${isFixed ? 'items-center' : 'flex-col lg:flex-row lg:items-center'} justify-between`}>
        <div>
          <h2 className={`font-semibold ${isFixed ? 'text-lg' : 'text-xl md:text-2xl mb-1'}`}>
            {title}
          </h2>
          {!hideDescription && description && !isFixed && (
            <p className="text-sm md:text-base opacity-80">{description}</p>
          )}
        </div>
        {toolbarActions && (
          <div className={`flex ${isFixed ? 'gap-2' : 'flex-wrap gap-2 mt-3 lg:mt-0 justify-start lg:justify-end'}`}>
            {toolbarActions}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  // Sticky 툴바 컴포넌트
  const stickyToolbar = isSticky && isMobile && portalContainer ? (
    <div 
      className={`${bgClass} ${textClass} shadow-lg px-4 py-3 fixed left-0 right-0 w-full sticky-toolbar cursor-pointer`}
      style={{
        top: `${60 + (document.querySelector('.notice-marquee')?.clientHeight || 36)}px`,
        zIndex: 20, // 헤더와 같은 레벨로 설정
        position: 'fixed',
      }}
      onClick={handleToolbarClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">
            {title}
          </h2>
        </div>
        {toolbarActions && (
          <div className="flex gap-2">
            {toolbarActions}
          </div>
        )}
        {children}
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* 원래 위치의 툴바 */}
      <div ref={containerRef}>
        <div style={{ 
          opacity: isSticky && isMobile ? 0 : 1,
          pointerEvents: isSticky && isMobile ? 'none' : 'auto'
        }}>
          {renderToolbar(false)}
        </div>
      </div>
      
      {/* Sticky 툴바 (모바일에서만) - Portal로 body에 렌더링 */}
      {stickyToolbar && portalContainer && ReactDOM.createPortal(stickyToolbar, portalContainer)}
    </>
  );
};

export { StyledToolbar };