import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

import { CommonHexagonBadge } from '@/partials/common';

import { IOfferRowProps } from './Offer';

const OfferRow = ({ path, size, iconSize, title, subTitle }: IOfferRowProps) => {
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
        className="card border-2 border-dashed border-brand-clarity bg-center bg-[length:600px] bg-no-repeat offer-bg"
      >
        <div className="card-body">
          <div className="flex items-center justify-center gap-5">
            <div className="flex justify-center">
              <CommonHexagonBadge
                size={size}
                badge={<KeenIcon icon="rocket" className={`${iconSize} text-brand`} />}
                stroke="stroke-brand-clarity"
                fill="fill-light"
              />
            </div>

            <div className="flex flex-col text-start">
              <span className="text-xl font-semibold text-gray-900 hover:text-primary-active mb-px">
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

export { OfferRow };
