import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils/Assets';

const Empty = () => {
  return (
    <Fragment>
      <div className="card p-8 lg:p-12">
        <div className="card-body">
          <div className="grid justify-center py-5">
            <img
              src={toAbsoluteUrl('/media/illustrations/11.svg')}
              className="dark:hidden max-h-[170px]"
              alt=""
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/11-dark.svg')}
              className="light:hidden max-h-[170px]"
              alt=""
            />
          </div>

          <div className="text-lg font-medium text-gray-900 text-center">
            Upload Item to Get Started
          </div>
          <div className="text-sm text-gray-700 text-center gap-1">
            Begin by crafting your inaugural list in minutes.&nbsp;
            <Link to="/account/billing/plans" className="text-sm font-medium link">
              Get Started!
            </Link>
          </div>
        </div>
      </div>

      <div className="flex grow justify-center pt-5 lg:pt-7.5">
        <Link to="/public-profile/profiles/default" className="btn btn-link">
          Check ready Templates
        </Link>
      </div>
    </Fragment>
  );
};

export { Empty };
