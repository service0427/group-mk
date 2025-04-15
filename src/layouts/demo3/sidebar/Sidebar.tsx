/* eslint-disable react-hooks/exhaustive-deps */
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { useResponsive, useViewport } from '@/hooks';
import { useDemo3Layout } from '..';
import { useEffect } from 'react';
import { usePathname } from '@/providers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

const Sidebar = () => {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useDemo3Layout();
  const { pathname, prevPathname } = usePathname();
  const desktopMode = useResponsive('up', 'lg');
  const mobileMode = useResponsive('down', 'lg');
  const [viewportHeight] = useViewport();
  const scrollableOffset = 70;
  const scrollableHeight = viewportHeight - scrollableOffset;
  const items = [
    {
      icon: 'chart-line-star',
      path: '/',
      tooltip: 'Dashboard'
    },
    {
      icon: 'profile-circle',
      path: '/public-profile/profiles/default',
      tooltip: 'Profile'
    },
    {
      icon: 'setting-2',
      active: true,
      path: '/account/home/get-started',
      tooltip: 'Account'
    },
    {
      icon: 'users',
      path: '/network/get-started',
      tooltip: 'Network'
    },
    {
      icon: 'security-user',
      path: '/account/billing/plans',
      tooltip: 'Plans'
    },
    {
      icon: 'messages',
      path: '/account/security/security-log',
      tooltip: 'Security Logs'
    },
    {
      icon: 'shop',
      path: '/account/notifications',
      tooltip: 'Notifications'
    },
    {
      icon: 'cheque',
      path: '/account/members/roles',
      tooltip: 'ACL'
    },
    {
      icon: 'code',
      path: '/account/api-keys',
      tooltip: 'API Keys'
    },
    {
      icon: 'question',
      path: 'https://keenthemes.com/metronic/tailwind/docs/',
      tooltip: 'Docs'
    }
  ];

  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  const renderContent = () => {
    return (
      <div className="fixed w-[--tw-sidebar-width] lg:top-[--tw-header-height] top-0 bottom-0 z-20 lg:flex flex-col items-stretch shrink-0 group py-3 lg:py-0">
        <div className="flex grow shrink-0">
          <div
            className="scrollable-y-auto grow gap-2.5 shrink-0 flex items-center flex-col"
            style={{
              ...(desktopMode && scrollableHeight > 0 && { height: `${scrollableHeight}px` })
            }}
          >
            {items.map((item, index) =>
              item.path.startsWith('http') ? (
                <a
                  href={item.path}
                  key={index}
                  data-tooltip={item.tooltip}
                  data-tooltip-placement="right"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-icon btn-icon-lg rounded-full size-10 border here:border-gray-300 
                    text-gray-600 hover:bg-light hover:text-primary hover:border-gray-300 ${
                      item.active ? 'bg-light text-primary' : ''
                    }`}
                >
                  <span className="menu-icon">
                    <KeenIcon icon={item.icon} />
                  </span>
                  <span className="tooltip">{item.tooltip}</span>
                </a>
              ) : (
                <Link
                  to={item.path}
                  key={index}
                  data-tooltip={item.tooltip}
                  data-tooltip-placement="right"
                  className={`btn btn-icon btn-icon-lg rounded-full size-10 border active:border-gray-300 text-gray-600 hover:bg-light hover:text-primary hover:border-gray-300 ${
                    item.active ? 'bg-light text-primary border-gray-300' : ''
                  }`}
                >
                  <span className="menu-icon">
                    <KeenIcon icon={item.icon} />
                  </span>
                  <span className="tooltip">{item.tooltip}</span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (mobileMode && prevPathname !== pathname) {
      handleMobileSidebarClose();
    }
  }, [mobileMode, pathname, prevPathname]);

  if (desktopMode) {
    return renderContent();
  } else {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          className="border-0 p-0 w-[--tw-sidebar-width] scrollable-y-auto"
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
