import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { CommonHexagonBadge } from '../common';

interface IAddNewProps {
  path: string;
  size: string;
  iconSize: string;
  title: string;
  subTitle: string;
}

const CardAddNewRow = ({ path, size, iconSize, title, subTitle }: IAddNewProps) => {
  return (
    <Fragment>
      <Link
        to={`/${path}`}
        className="card border-2 border-dashed border-brand-clarity bg-center bg-cover bg-no-repeat"
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
              <span className="text-lg font-semibold text-gray-900 hover:text-primary-active mb-px">
                {title}
              </span>
              <span className="text-2sm font-normal text-gray-600">{subTitle}</span>
            </div>
          </div>
        </div>
      </Link>
    </Fragment>
  );
};

export { CardAddNewRow, type IAddNewProps };
