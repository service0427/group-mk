/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
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
  SheetTitle
} from '@/components/ui/sheet';

export const Sidebar = () => {
  const selfRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const scrollableOffset = 40;
  const [viewportHeight] = useViewport();
  const { pathname, prevPathname } = usePathname();

  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = getHeight(headerRef.current);
      const availableHeight = viewportHeight - headerHeight - scrollableOffset;
      setScrollableHeight(availableHeight);
    } else {
      setScrollableHeight(viewportHeight);
    }
  }, [viewportHeight]);

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
          width: layout.options.sidebar.collapse ? '80px' : '280px',
          transition: 'width 0.3s ease',
          ...(!desktopMode && { height: '100%' }) // 모바일에서 높이 100%
        }}
      >
        {desktopMode && <SidebarHeader ref={headerRef} />}
        <SidebarContent {...(desktopMode && { height: scrollableHeight })} />
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
      document.body.classList.add('has-mobile-sidebar-open');
      document.body.setAttribute('data-sidebar-open', 'true');
    } else {
      document.body.classList.remove('has-mobile-sidebar-open');
      document.body.setAttribute('data-sidebar-open', 'false');
    }

    // cleanup
    return () => {
      document.body.classList.remove('has-mobile-sidebar-open');
      document.body.removeAttribute('data-sidebar-open');
    };
  }, [mobileSidebarOpen, desktopMode]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          className="border-0 p-0 w-full max-w-[280px] sm:max-w-[280px] h-full flex flex-col"
          forceMount={true}
          side="left"
          close={false}
          style={{
            padding: '0',
            height: '100vh',
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
      </Sheet>
    );
  }
};