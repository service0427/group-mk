import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

import { CommonHexagonBadge } from '@/partials/common';

interface IOfferRowProps {
  path: string;
  size: string;
  iconSize: string;
  title: string;
  subTitle: string;
}

const Offer = ({ path, size, iconSize, title, subTitle }: IOfferRowProps) => {
  return (
    <Fragment>
      <style>
        {`
          .offer-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-4.png')}');
          }
          .dark .offer-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-4-dark.png')}');
          }
        `}
      </style>

      <Link
        to={path}
        className="card border-2 border-dashed border-brand-clarity bg-center bg-[length:750px] bg-no-repeat offer-bg"
      >
        <div className="card-body grid items-center">
          <div className="flex flex-col gap-5">
            <div className="flex justify-center pt-5">
              <CommonHexagonBadge
                size={size}
                badge={<KeenIcon icon="rocket" className={`${iconSize} text-brand`} />}
                stroke="stroke-brand-clarity"
                fill="fill-light"
              />
            </div>

            <div className="flex flex-col text-center">
              <span className="text-1.5xl font-semibold text-gray-900 hover:text-primary-active mb-px">
                {title}
              </span>
              <span className="text-sm font-medium text-gray-600">{subTitle}</span>
            </div>
          </div>
        </div>
      </Link>
    </Fragment>
  );
};

export { Offer, type IOfferRowProps };
