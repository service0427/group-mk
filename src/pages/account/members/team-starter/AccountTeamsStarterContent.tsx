import { Fragment } from 'react';

import { toAbsoluteUrl } from '@/utils';

import { MiscFaq, MiscHelp2, MiscStarter } from '@/partials/misc';

const AccountTeamsStarterContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <MiscStarter
        image={
          <Fragment>
            <img
              src={toAbsoluteUrl('/media/illustrations/32.svg')}
              className="dark:hidden max-h-[230px]"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/32-dark.svg')}
              className="light:hidden max-h-[230px]"
              alt=""
            />
          </Fragment>
        }
        title="Swift Setup for New Teams"
        subTitle={
          <Fragment>
            Enhance team formation and management with easy-to-use tools for communication,
            <br />
            task organization, and progress tracking, all in one place.
          </Fragment>
        }
        engage={{
          path: '/public-profile/teams',
          label: 'Create New Team',
          btnColor: 'btn-primary'
        }}
      />

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { AccountTeamsStarterContent };
