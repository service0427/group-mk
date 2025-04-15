import { Fragment } from 'react';

import { toAbsoluteUrl } from '@/utils';

import { MiscEngage } from '.';

const MiscHelp = () => {
  return (
    <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
      <MiscEngage
        title="Questions ?"
        description="Visit our Help Center for detailed assistance on billing, payments, and subscriptions."
        image={
          <Fragment>
            <img
              src={toAbsoluteUrl('/media/illustrations/2.svg')}
              className="dark:hidden max-h-[150px]"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/2-dark.svg')}
              className="light:hidden max-h-[150px]"
              alt=""
            />
          </Fragment>
        }
        more={{ title: 'Go to Help Center', url: '#' }}
      />

      <MiscEngage
        title="Contact Support"
        description="Need assistance? Contact our support team for prompt, personalized help your queries & concerns."
        image={
          <Fragment>
            <img
              src={toAbsoluteUrl('/media/illustrations/4.svg')}
              className="dark:hidden max-h-[150px]"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/4-dark.svg')}
              className="light:hidden max-h-[150px]"
              alt=""
            />
          </Fragment>
        }
        more={{ title: 'Contact Support', url: 'https://devs.keenthemes.com/unresolved' }}
      />
    </div>
  );
};

export { MiscHelp };
