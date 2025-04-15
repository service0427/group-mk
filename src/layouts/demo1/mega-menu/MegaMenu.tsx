/* eslint-disable react-hooks/exhaustive-deps */
import { useResponsive } from '@/hooks';
import { useEffect } from 'react';
import { usePathname } from '@/providers';
import { useDemo1Layout } from '@/layouts/demo1';
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
  const { mobileMegaMenuOpen, setMobileMegaMenuOpen } = useDemo1Layout();

  const handleDrawerClose = () => {
    setMobileMegaMenuOpen(false);
  };

  useEffect(() => {
    // Hide drawer on route chnage after menu link click
    if (desktopMode === false && prevPathname !== pathname) {
      handleDrawerClose();
    }
  }, [desktopMode, pathname, prevPathname]);

  if (desktopMode) {
    return <MegaMenuInner />;
  } else {
    return (
      <Sheet open={mobileMegaMenuOpen} onOpenChange={handleDrawerClose}>
        <SheetContent
          className="border-0 p-0 w-[225px] scrollable-y-auto"
          forceMount={true}
          side="left"
          close={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Mobile Menu</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
          <MegaMenuInner />
        </SheetContent>
      </Sheet>
    );
  }
};

export { MegaMenu };
