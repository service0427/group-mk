import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils/Assets';

const GettingStarted = () => {
  return (
    <div className="card">
      <div className="card-body lg:py-9">
        <div className="flex justify-center pb-5">
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
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm text-gray-700">
            Begin by crafting your inaugural list in minutes.
          </span>
          <Link to="/account/billing/plans" className="text-sm font-medium link">
            Get Started!
          </Link>
        </div>
      </div>
    </div>
  );
};

export { GettingStarted };
