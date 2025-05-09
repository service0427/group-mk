/* eslint-disable react-hooks/exhaustive-deps */
import { useResponsive } from '@/hooks';
import { useEffect } from 'react';
import { usePathname } from '@/providers';
import { useStandLayout } from '@/layouts/stand';
import { MegaMenuInner } from '.';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

const MegaMenu = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { pathname, prevPathname } = usePathname();
  const { mobileMegaMenuOpen, setMobileMegaMenuOpen } = useStandLayout();

  const handleDrawerClose = () => {
    setMobileMegaMenuOpen(false);
  };

  useEffect(() => {
    // Hide drawer on route change after menu link click
    if (desktopMode === false && prevPathname !== pathname) {
      handleDrawerClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  // 모바일에서는 MegaMenu를 숨김 (요청에 따라)
  if (!desktopMode) {
    return null;
  }

  // PC에서만 표시
  return <MegaMenuInner />;
};

export { MegaMenu };
