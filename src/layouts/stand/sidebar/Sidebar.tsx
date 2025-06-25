/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useResponsive, useViewport } from '@/hooks';
import { useStandLayout } from '../';
import { SidebarContent, SidebarHeader } from './';
import clsx from 'clsx';
import { getHeight } from '@/utils';
import { usePathname } from '@/providers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetOverlay,
  SheetPortal
} from '@/components/ui/sheet';

export const Sidebar = () => {
  const selfRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const dynamicOffsetRef = useRef<number>(40);
  const [viewportHeight] = useViewport();
  const { pathname, prevPathname } = usePathname();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 높이 계산 함수
  const calculateHeight = useCallback(() => {
    if (headerRef.current) {
      const headerHeight = getHeight(headerRef.current);
      
      // 콘텐츠의 실제 높이를 기반으로 동적 오프셋 계산
      let currentOffset = 40;
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const visibleHeight = contentRef.current.clientHeight;
        
        // 콘텐츠가 넘치는 경우 추가 오프셋 적용
        const additionalOffset = contentHeight > visibleHeight ? 20 : 0;
        currentOffset = 40 + additionalOffset;
        
        // ref 값 업데이트
        dynamicOffsetRef.current = currentOffset;
      }
      
      const availableHeight = viewportHeight - headerHeight - currentOffset;
      setScrollableHeight(availableHeight);
      
      // CSS 변수로 높이 값 공유
      document.documentElement.style.setProperty('--sidebar-scrollable-height', `${availableHeight}px`);
    } else {
      setScrollableHeight(viewportHeight);
    }
  }, [viewportHeight]); // dynamicOffset을 의존성에서 제거

  // ResizeObserver 설정
  useLayoutEffect(() => {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      // 애니메이션 프레임으로 리플로우 최적화
      requestAnimationFrame(() => {
        calculateHeight();
      });
    });

    // 헤더와 콘텐츠 요소 관찰
    if (headerRef.current) {
      resizeObserverRef.current.observe(headerRef.current);
    }
    if (contentRef.current) {
      resizeObserverRef.current.observe(contentRef.current);
    }

    // 초기 계산
    calculateHeight();

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [calculateHeight]);

  // 뷰포트 변경 시 높이 재계산
  useEffect(() => {
    calculateHeight();
  }, [viewportHeight]); // calculateHeight는 이미 viewportHeight에 의존하므로 제거

  const desktopMode = useResponsive('up', 'lg');
  const { mobileSidebarOpen, setMobileSidebarOpen } = useStandLayout();
  const { layout } = useStandLayout();
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-coal-600'
      : 'dark:bg-coal-600';

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    return (
      <div
        ref={selfRef}
        className={clsx(
          'sidebar sidebar-enhanced bg-light lg:border-e lg:border-e-gray-200 dark:border-e-coal-100 lg:h-screen flex flex-col items-stretch shrink-0 z-30',
          themeClass,
          !desktopMode && 'h-full' // 모바일에서 전체 높이
        )}
        style={{
          ...(desktopMode && {
            width: layout.options.sidebar.collapse ? '80px' : '280px',
            transition: 'width 0.3s ease'
          }),
          ...(!desktopMode && { 
            width: '100%', // 모바일에서 전체 너비 사용
            height: '100%' // 모바일에서 높이 100%
          })
        }}
      >
        {desktopMode && <SidebarHeader ref={headerRef} />}
        <SidebarContent 
          {...(desktopMode && { height: scrollableHeight })} 
          ref={contentRef}
          onMenuStateChange={calculateHeight}
        />
      </div>
    );
  };

  useEffect(() => {
    // Hide drawer on route change after menu link click
    if (!desktopMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  // 모바일 사이드바 열림/닫힘 시 body 클래스 제어
  useEffect(() => {
    if (!desktopMode && mobileSidebarOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // iOS Safari 주소창 숨기기 트릭
      if (window.scrollY === 0) {
        // 페이지 최상단에 있으면 살짝 아래로 스크롤
        window.scrollTo(0, 1);
      }
      
      // body 클래스 추가
      document.body.classList.add('has-mobile-sidebar-open');
      document.body.setAttribute('data-sidebar-open', 'true');
      document.body.style.top = `-${scrollY}px`;
      
      // iOS에서 주소창 숨기기 시도
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    } else {
      // 원래 스크롤 위치 복원
      const scrollY = document.body.style.top;
      document.body.classList.remove('has-mobile-sidebar-open');
      document.body.setAttribute('data-sidebar-open', 'false');
      document.body.style.removeProperty('top');
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }

    // cleanup
    return () => {
      document.body.classList.remove('has-mobile-sidebar-open');
      document.body.removeAttribute('data-sidebar-open');
      document.body.style.removeProperty('top');
    };
  }, [mobileSidebarOpen, desktopMode]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetPortal>
          <SheetOverlay className="!top-[100px]" />
          <SheetContent
            className="border-0 p-0 w-full max-w-[280px] sm:max-w-[280px] flex flex-col !top-[100px] !bottom-0 !h-auto"
            forceMount={true}
            side="left"
            close={false}
            overlay={false}
            style={{
              padding: '0',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Mobile Menu</SheetTitle>
              <SheetDescription></SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </SheetContent>
        </SheetPortal>
      </Sheet>
    );
  }
};