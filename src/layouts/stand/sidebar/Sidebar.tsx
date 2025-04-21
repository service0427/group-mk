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

  // PC 버전에서는 마우스 오버 이벤트 사용하지 않고 토글 버튼만 사용

  const renderContent = () => {
    return (
      <div
        ref={selfRef}
        // 마우스 오버/아웃 이벤트 핸들러 제거
        className={clsx(
          'sidebar bg-light lg:border-e lg:border-e-gray-200 dark:border-e-coal-100 lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0',
          themeClass
        )}
      >
        {desktopMode && <SidebarHeader ref={headerRef} />}
        <SidebarContent {...(desktopMode && { height: scrollableHeight })} />
      </div>
    );
  };

  useEffect(() => {
    // Hide drawer on route chnage after menu link click
    if (!desktopMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          className="border-0 p-0 w-full max-w-[280px] sm:max-w-[280px] scrollable-y-auto"
          forceMount={true}
          side="left"
          close={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Mobile Menu</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }
};
