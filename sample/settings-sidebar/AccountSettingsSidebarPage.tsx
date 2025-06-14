import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { PageNavbar } from '@/pages/account';

import { AccountSettingsSidebarContent } from '.';
import { useLayout } from '@/providers';

const AccountSettingsSidebarPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      <PageNavbar />

      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Intuitive Access to In-Depth Customization</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <a href="#" className="btn btn-sm btn-light">
                Public Profile
              </a>
              <a href="#" className="btn btn-sm btn-primary">
                Get Started
              </a>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <AccountSettingsSidebarContent />
      </Container>
    </Fragment>
  );
};

export { AccountSettingsSidebarPage };
