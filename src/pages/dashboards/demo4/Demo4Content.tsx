import { Fragment } from 'react';
import { BlockList } from '@/pages/account/security/privacy-settings';
import { MiscCreateTeam } from '@/partials/misc';
import { toAbsoluteUrl } from '@/utils';
import { Highlights, Teams } from '..';

const Demo4Content = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-2">
          <MiscCreateTeam
            image={
              <Fragment>
                <img
                  src={toAbsoluteUrl('/media/illustrations/32.svg')}
                  className="dark:hidden max-h-[180px]"
                  alt=""
                />
                <img
                  src={toAbsoluteUrl('/media/illustrations/32-dark.svg')}
                  className="light:hidden max-h-[180px]"
                  alt=""
                />
              </Fragment>
            }
            className="h-full"
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
              label: 'Create Team',
              btnColor: 'btn-primary'
            }}
          />
        </div>

        <div className="lg:col-span-1">
          <Highlights />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-2">
          <Teams />
        </div>
        <div className="lg:col-span-1">
          <BlockList
            className="h-full"
            text="Users on the block list are unable to send chat requests or messages to you anymore, ever, or again"
          />
        </div>
      </div>
    </div>
  );
};

export { Demo4Content };
