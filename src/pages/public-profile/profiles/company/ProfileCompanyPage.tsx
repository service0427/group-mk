import { Fragment } from 'react';

import { toAbsoluteUrl } from '@/utils/Assets';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';

import { UserProfileHero } from '@/partials/heros';
import { Navbar, NavbarActions, NavbarDropdown } from '@/partials/navbar';
import { PageMenu } from '@/pages/public-profile';

import { ProfileCompanyContent } from './';

const ProfileCompanyPage = () => {
  const image = (
    <div className="flex items-center justify-center rounded-full border-2 border-success-clarity size-[100px] shrink-0 bg-light">
      <img src={toAbsoluteUrl('/media/brand-logos/duolingo.svg')} className="size-[50px]" />
    </div>
  );

  return (
    <Fragment>
      <UserProfileHero
        name="Duolingo"
        image={image}
        info={[
          { label: 'Public Company', icon: 'abstract-41' },
          { label: 'Pittsburgh, KS', icon: 'geolocation' },
          { email: 'info@duolingo.com', icon: 'sms' }
        ]}
      />

      <Container>
        <Navbar>
          <PageMenu />

          <NavbarActions>
            <button type="button" className="btn btn-sm btn-primary">
              <KeenIcon icon="users" /> Follow
            </button>
            <button className="btn btn-sm btn-icon btn-light">
              <KeenIcon icon="messages" />
            </button>
            <NavbarDropdown />
          </NavbarActions>
        </Navbar>
      </Container>

      <Container>
        <ProfileCompanyContent />
      </Container>
    </Fragment>
  );
};

export { ProfileCompanyPage };
