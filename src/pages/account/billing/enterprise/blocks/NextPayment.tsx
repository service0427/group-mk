import { KeenIcon } from '@/components';

import { CommonHexagonBadge } from '@/partials/common';

const NextPayment = () => {
  return (
    <div className="card grow">
      <div className="card-header">
        <h3 className="card-title">Next Payment</h3>
      </div>

      <div className="card-body lg:7.5">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap border border-gray-200 rounded-xl gap-2 px-4 py-4 bg-secondary-clarity">
            <div className="flex items-center gap-3.5">
              <CommonHexagonBadge
                stroke="stroke-brand-clarity"
                fill="fill-brand-light"
                size="size-[50px]"
                badge={<KeenIcon icon="calendar" className="text-xl text-brand" />}
              />

              <div className="flex flex-col">
                <a href="#" className="text-sm font-medium hover:text-primary text-gray-900">
                  on 17 Aug, 2024
                </a>
                <p className="text-2sm text-gray-700">Due date</p>
              </div>
            </div>

            <button className="btn btn-sm btn-icon btn-outline btn-success rounded-full">
              <KeenIcon icon="check" />
            </button>
          </div>
          <div className="place-self-end lg:pb-2.5">
            <a href="#" className="btn btn-sm btn-primary">
              Manage Payment
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export { NextPayment };
