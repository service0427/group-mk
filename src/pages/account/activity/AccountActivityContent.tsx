import { Fragment } from 'react';

import { toAbsoluteUrl } from '@/utils';

import { MiscEngage } from '@/partials/misc';

import { ProfileActivityContent } from '@/pages/public-profile/activity';

const AccountActivityContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <ProfileActivityContent />

      <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
        <MiscEngage
          title="Contact Support"
          description="Need assistance? Contact our support team for prompt, personalized help your queries & concerns."
          image={
            <Fragment>
              <img
                src={toAbsoluteUrl('/media/illustrations/31.svg')}
                className="dark:hidden max-h-[150px]"
                alt="image"
              />
              <img
                src={toAbsoluteUrl('/media/illustrations/31-dark.svg')}
                className="light:hidden max-h-[150px]"
                alt="image"
              />
            </Fragment>
          }
          more={{
            title: 'Contact Support',
            url: ''
          }}
        />

        <MiscEngage
          title="Questions"
          description="Visit our Help Center for detailed assistance on billing, payments, and subscriptions."
          image={
            <Fragment>
              <img
                src={toAbsoluteUrl('/media/illustrations/29.svg')}
                className="dark:hidden max-h-[150px]"
                alt="image"
              />
              <img
                src={toAbsoluteUrl('/media/illustrations/29-dark.svg')}
                className="light:hidden max-h-[150px]"
                alt="image"
              />
            </Fragment>
          }
          more={{
            title: 'Go to Help Center',
            url: ''
          }}
        />
      </div>
    </div>
  );
};

export { AccountActivityContent };
