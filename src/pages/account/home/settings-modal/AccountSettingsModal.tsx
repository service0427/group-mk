import { useEffect, useRef, useState } from 'react';
import { Scrollspy } from '@/components';
import { AccountSettingsSidebar } from '@/pages/account/home/settings-sidebar';
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
} from '@/pages/account/home/settings-sidebar/blocks';
import { useResponsive, useViewport } from '@/hooks';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface IModalProfileProps {
  open: boolean;
  onOpenChange: () => void;
}

const AccountSettingsModal = ({ open, onOpenChange }: IModalProfileProps) => {
  const desktopMode = useResponsive('up', 'lg');
  const navBar = useRef<any | null>(null);
  const parentRef = useRef<any | null>(null);
  const [sidebarHeight, setSidebarHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const offset = 260;

  useEffect(() => {
    setSidebarHeight(viewportHeight - offset);
  }, [viewportHeight]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="container-fixed max-w-[auto] flex flex-col p-10 overflow-hidden [&>button]:hidden">
        <DialogHeader className="p-0 border-0">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <div className="flex items-center justify-between flex-wrap grow gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-semibold leading-none text-gray-900">Settings - Modal</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-gray-700">
                Dynamic, Focused Adjustment Interface
              </div>
            </div>
            <button className="btn btn-sm btn-light" onClick={onOpenChange}>
              Close
            </button>
          </div>
        </DialogHeader>
        <DialogBody className="scrollable-y py-0 mb-5 ps-0 pe-3 -me-7" ref={parentRef}>
          <div className="flex grow gap-5 lg:gap-7.5">
            {desktopMode && (
              <div className="block w-[230px] shrink-0">
                <div
                  ref={navBar}
                  className="w-[230px] fixed z-10 scrollable-y-auto"
                  style={{ maxHeight: `${sidebarHeight}px` }}
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
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export { AccountSettingsModal };
