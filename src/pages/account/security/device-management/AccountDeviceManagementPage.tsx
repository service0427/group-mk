import { Fragment } from 'react';

import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { PageNavbar } from '@/pages/account';

import { AccountDeviceManagementContent } from '.';
import { useLayout } from '@/providers';

const AccountDeviceManagementPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      <PageNavbar />

      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <span className="text-sm text-gray-600">Authorized Devices for Report Access</span>
                <span className="size-0.75 bg-gray-600 rounded-full"></span>
                <a href="#" className="font-semibold btn btn-link link">
                  Unlink All Devices
                </a>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <a href="#" className="btn btn-sm btn-light">
                Security Overview
              </a>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <AccountDeviceManagementContent />
      </Container>
    </Fragment>
  );
};

export { AccountDeviceManagementPage };
