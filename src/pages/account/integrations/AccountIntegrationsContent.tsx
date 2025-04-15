import { Fragment } from 'react';

import { toAbsoluteUrl } from '@/utils';

import { MiscFaq, MiscHelp2, MiscStarter } from '@/partials/misc';

import { Integrations } from './blocks';

const AccountIntegrationsContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Integrations />

      <MiscStarter
        image={
          <Fragment>
            <img
              src={toAbsoluteUrl('/media/illustrations/28.svg')}
              className="dark:hidden max-h-[230px]"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/28-dark.svg')}
              className="light:hidden max-h-[230px]"
              alt=""
            />
          </Fragment>
        }
        title="Add New Integration"
        subTitle={
          <Fragment>
            Explore New Integration: Expand Your Toolkit with Cutting-Edge,
            <br />
            User-Friendly Solutions Tailored for Efficient and Innovative Project Management.
          </Fragment>
        }
        engage={{
          path: '/network/user-cards/mini-cards',
          label: 'Start Now',
          btnColor: 'btn-primary'
        }}
      />

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { AccountIntegrationsContent };
