/* eslint-disable react-hooks/exhaustive-deps */
import { Link } from 'react-router-dom';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { useEffect, useRef, useState } from 'react';
import { getHeight, toAbsoluteUrl } from '@/utils';
import { useResponsive, useViewport } from '@/hooks';
import { DropdownUser } from '@/partials/dropdowns/user';
import { DropdownChat } from '@/partials/dropdowns/chat';
import { DropdownApps } from '@/partials/dropdowns/apps';
import { useDemo8Layout } from '..';
import { SidebarMenu } from '.';
import { usePathname } from '@/providers';
import { useLanguage } from '@/i18n';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

const Sidebar = () => {
  const desktopMode = useResponsive('up', 'lg');
  const mobileMode = useResponsive('down', 'lg');
  const { pathname, prevPathname } = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useDemo8Layout();
  const itemChatRef = useRef<any>(null);
  const itemUserRef = useRef<any>(null);
  const { isRTL } = useLanguage();

  const handleDropdownChatShow = () => {
    window.dispatchEvent(new Event('resize'));
  };

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const scrollableOffset = 40;

  useEffect(() => {
    if (footerRef.current) {
      const headerHeight = headerRef.current ? getHeight(headerRef.current) : 0;
      const footerHeight = getHeight(footerRef.current);
      const availableHeight = viewportHeight - headerHeight - footerHeight - scrollableOffset;
      setScrollableHeight(availableHeight);
    } else {
      setScrollableHeight(viewportHeight);
    }
  }, [viewportHeight]);

  const renderContent = () => {
    return (
      <div className="grow lg:grow-0 lg:fixed top-0 bottom-0 z-20 flex flex-col items-stretch shrink-0 bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark]">
        {desktopMode && (
          <div
            ref={headerRef}
            className="hidden lg:flex items-center justify-center shrink-0 pt-8 pb-3.5"
          >
            <Link to="/">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo-square-gray.svg')}
                className="dark:hidden min-h-[42px]"
              />
              <img
                src={toAbsoluteUrl('/media/app/mini-logo-square-gray-dark.svg')}
                className="hidden dark:block min-h-[42px]"
              />
            </Link>
          </div>
        )}

        <div
          className="scrollable-y-hover grow gap-2.5 shrink-0 flex items-center pt-5 lg:pt-0 ps-3 pe-3 lg:pe-0 flex-col"
          style={{
            ...(desktopMode && scrollableHeight > 0 && { height: `${scrollableHeight}px` })
          }}
        >
          <SidebarMenu />
        </div>

        <div ref={footerRef} className="flex flex-col gap-5 items-center shrink-0 pb-4">
          <div className="flex flex-col gap-1.5">
            <Menu>
              <MenuItem
                ref={itemChatRef}
                onShow={handleDropdownChatShow}
                toggle="dropdown"
                trigger="click"
                dropdownProps={{
                  placement: isRTL() ? 'right-start' : 'right-end',
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [110, 30] // [skid, distance]
                      }
                    }
                  ]
                }}
              >
                <MenuToggle className="btn btn-icon btn-icon-xl relative rounded-md size-9 border border-transparent hover:bg-light hover:text-primary hover:border-gray-200 dropdown-open:bg-gray-200 text-gray-600">
                  <KeenIcon icon="messages" />
                </MenuToggle>

                {DropdownChat({ menuTtemRef: itemChatRef })}
              </MenuItem>
            </Menu>

            <Menu>
              <MenuItem
                ref={itemChatRef}
                onShow={handleDropdownChatShow}
                toggle="dropdown"
                trigger="click"
                dropdownProps={{
                  placement: isRTL() ? 'right-start' : 'right-end',
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: isRTL() ? [-20, 30] : [20, 30] // [skid, distance]
                      }
                    }
                  ]
                }}
              >
                <MenuToggle className="btn btn-icon btn-icon-xl relative rounded-md size-9 border border-transparent hover:bg-light hover:text-primary hover:border-gray-200 dropdown-open:bg-gray-200 text-gray-600">
                  <KeenIcon icon="setting-2" />
                </MenuToggle>

                {DropdownApps()}
              </MenuItem>
            </Menu>
          </div>

          <Menu>
            <MenuItem
              ref={itemUserRef}
              toggle="dropdown"
              trigger="click"
              dropdownProps={{
                placement: isRTL() ? 'right-start' : 'right-end',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: isRTL() ? [-20, 28] : [20, 28] // [skid, distance]
                    }
                  }
                ]
              }}
            >
              <MenuToggle className="btn btn-icon">
                <img
                  className="size-8 justify-center rounded-lg border border-gray-500 shrink-0"
                  src={toAbsoluteUrl('/media/avatars/gray/5.png')}
                  alt=""
                />
              </MenuToggle>
              {DropdownUser({ menuItemRef: itemUserRef })}
            </MenuItem>
          </Menu>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Hide drawer on route chnage after menu link click
    if (mobileMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [mobileMode, pathname, prevPathname]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={handleMobileSidebarClose}>
        <SheetContent
          className="border-0 p-0 w-[--tw-sidebar-width] flex items-stretch flex-col scrollable-y-auto"
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

export { Sidebar };
