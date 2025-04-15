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
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-14.png')}');
          }
          .dark .upgrade-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-14-dark.png')}');
          }
        `}
      </style>

      <div className="card rounded-xl">
        <div className="flex items-center justify-between grow gap-5 p-5 rtl:bg-[center_left_-8rem] bg-[center_right_-8rem] bg-no-repeat bg-[length:700px] upgrade-bg">
          <div className="flex items-center gap-4">
            <CommonHexagonBadge
              stroke="stroke-primary-clarity"
              fill="fill-primary-light"
              size="size-[50px]"
              badge={<KeenIcon icon="cheque" className="text-1.5xl text-primary" />}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <a
                  href="#"
                  className="text-base font-medium text-gray-900 hover:text-primary-active"
                >
                  Upgrade your Components.io to Enterprise
                </a>
                <span className="badge badge-sm badge-danger badge-outline">
                  Trial expires in 29 days
                </span>
              </div>

              <div className="text-2sm text-gray-700">
                Enterprise Components.io is a website offering high-quality, advanced UI components
                designed for developers, enhancing <br />
                efficiency and aesthetics in web and mobile app development.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a href="#" className="btn btn-sm btn-light btn-clear">
              Cancel Trial
            </a>
            <a href="#" className="btn btn-sm btn-dark">
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export { Upgrade };
