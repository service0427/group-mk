import { useResponsive, useScrollPosition } from '@/hooks';
import {
  AdvancedSettingsAddress,
  AdvancedSettingsAppearance,
  AdvancedSettingsNotifications,
  AdvancedSettingsPreferences,
  AuthEmail,
  AuthPassword,
  AuthSingleSingOn,
  AuthSocialSignIn,
  AuthTwoFactor,
  BasicSettings,
  DeleteAccount,
  ExternalServicesIntegrations,
  ExternalServicesManageApi
} from './blocks';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Scrollspy } from '@/components/scrollspy/Scrollspy';
import { AccountSettingsSidebar } from '@/pages/account/home/settings-sidebar';
import { useLayout } from '@/providers';

const stickySidebarClasses: Record<string, string> = {
  'demo1-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo2-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo3-layout': 'top-[calc(var(--tw-header-height)+var(--tw-navbar-height)+1rem)]',
  'demo4-layout': 'top-[3rem]',
  'demo5-layout': 'top-[calc(var(--tw-header-height)+1.5rem)]',
  'demo6-layout': 'top-[3rem]',
  'demo7-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo8-layout': 'top-[3rem]',
  'demo9-layout': 'top-[calc(var(--tw-header-height)+1rem)]',
  'demo10-layout': 'top-[1.5rem]'
};

const AccountSettingsSidebarContent = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { currentLayout } = useLayout();
  const [sidebarSticky, setSidebarSticky] = useState(false);

  // Initialize ref for parentEl
  const parentRef = useRef<HTMLElement | Document>(document); // Default to document
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  // Effect to update parentRef after the component mounts
  useEffect(() => {
    const scrollableElement = document.getElementById('scrollable_content');
    if (scrollableElement) {
      parentRef.current = scrollableElement;
    }
  }, []); // Run only once on component mount

  // Handle scroll position and sidebar stickiness
  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition, currentLayout?.options]);

  // Get the sticky class based on the current layout, provide a default if not found
  const stickyClass = currentLayout?.name
    ? stickySidebarClasses[currentLayout.name] || 'top-[calc(var(--tw-header-height)+1rem)]'
    : 'top-[calc(var(--tw-header-height)+1rem)]';

  return (
    <div className="flex grow gap-5 lg:gap-7.5">
      {desktopMode && (
        <div className="w-[230px] shrink-0">
          <div
            className={clsx('w-[230px]', sidebarSticky && `fixed z-10 start-auto ${stickyClass}`)}
          >
            <Scrollspy offset={100} targetRef={parentRef}>
              <AccountSettingsSidebar />
            </Scrollspy>
          </div>
        </div>
      )}

      <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
        <BasicSettings />

        <AuthEmail />

        <AuthPassword />

        <AuthSocialSignIn />

        <AuthSingleSingOn />

        <AuthTwoFactor />

        <AdvancedSettingsPreferences />

        <AdvancedSettingsAppearance title={''} />

        <AdvancedSettingsNotifications />

        <AdvancedSettingsAddress />

        <ExternalServicesManageApi title={''} switch={false} />

        <ExternalServicesIntegrations />

        <DeleteAccount />
      </div>
    </div>
  );
};

export { AccountSettingsSidebarContent };
