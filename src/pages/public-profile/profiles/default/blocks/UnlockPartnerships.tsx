import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils/Assets';

const UnlockPartnerships = () => {
  return (
    <div className="card">
      <div className="card-body px-10 py-7.5 lg:pe-12.5">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-1.5xl font-semibold text-gray-900">
              Unlock Creative <br />
              Partnerships on Our Blog
            </h2>

            <p className="text-sm text-gray-700 leading-5.5">
              Explore exciting collaboration opportunities with our blog. We&apos;re open to
              partnerships, guest posts, and more. Join us to share your insights and grow your
              audience.
            </p>
          </div>

          <img
            src={toAbsoluteUrl('/media/illustrations/1.svg')}
            className="dark:hidden max-h-[160px]"
            alt=""
          />
          <img
            src={toAbsoluteUrl('/media/illustrations/1-dark.svg')}
            className="light:hidden max-h-[160px]"
            alt=""
          />
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to="/network/get-started" className="btn btn-link">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export { UnlockPartnerships };
