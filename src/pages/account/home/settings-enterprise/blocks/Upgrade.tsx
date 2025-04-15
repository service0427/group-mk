import { Fragment } from 'react';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

import { CommonHexagonBadge } from '@/partials/common';

const Upgrade = () => {
  return (
    <Fragment>
      <style>
        {`
          .upgrade-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-5.png')}');
          }
          .dark .upgrade-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-5-dark.png')}');
          }
        `}
      </style>

      <div className="card rounded-xl">
        <div className="flex items-center flex-wrap sm:flex-wrap justify-between grow gap-2 p-5 rtl:[background-position:-30%_41%] [background-position:121%_41%] bg-no-repeat bg-[length:660px_310px] upgrade-bg">
          <div className="flex items-center gap-4">
            <CommonHexagonBadge
              stroke="stroke-brand-clarity"
              fill="fill-brand-light"
              size="size-[50px]"
              badge={<KeenIcon icon="information-4" className="text-xl text-brand" />}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center flex-wrap gap-2.5">
                <a
                  href="#"
                  className="text-base font-medium text-gray-900 hover:text-primary-active"
                >
                  Upgrade your business info
                </a>
                <span className="badge badge-sm badge-outline">16 days left</span>
              </div>

              <div className="text-2sm text-gray-800">
                Elevate business information for a standout profile. Utilize premium features,
                ensuring success with enhanced details.
                <br />
                Upgrade now for heightened visibility and broader impact.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div>
              <button className="btn btn-sm btn-dark">Start</button>
            </div>
            <a href="#" className="btn btn-sm btn-clear btn-light">
              Skip
            </a>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export { Upgrade };
