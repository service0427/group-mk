import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { NetworkGetStartedContent } from '.';
import { useLayout } from '@/providers';

const NetworkGetStartedPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-gray-600">19 issues need your attention</span>
                  <span className="size-0.75 bg-gray-600 rounded-full"></span>
                  <Link
                    to="/account/security/security-log"
                    className="font-semibold btn btn-link link"
                  >
                    Security Log
                  </Link>
                </div>
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <NetworkGetStartedContent />
      </Container>
    </Fragment>
  );
};

export { NetworkGetStartedPage };
