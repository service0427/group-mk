import { toAbsoluteUrl } from '@/utils';
import React from 'react';
import { Link } from 'react-router-dom';

const ModalSearchNoResults = () => {
  return (
    <div className="flex flex-col text-center py-9 gap-5">
      <div className="flex justify-center">
        <img
          src={toAbsoluteUrl('/media/illustrations/33.svg')}
          className="dark:hidden max-h-[113px]"
          alt="image"
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/33-dark.svg')}
          className="light:hidden max-h-[113px]"
          alt="image"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-gray-900 text-center">No Results Found</h3>
        <span className="text-2sm font-medium text-center text-gray-600">
          Refine your query to discover relevant items
        </span>
      </div>
      <div className="flex justify-center">
        <Link to="#" className="btn btn-sm btn-light flex justify-center">
          View Projects
        </Link>
      </div>
    </div>
  );
};

export { ModalSearchNoResults };
