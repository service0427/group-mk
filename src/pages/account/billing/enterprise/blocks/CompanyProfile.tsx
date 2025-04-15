import { toAbsoluteUrl } from '@/utils';

import { CommonAvatars, IAvatarsItems } from '@/partials/common';

interface ICompanyProfileItem {
  total: string;
  description: string;
}
interface ICompanyProfileItems extends Array<ICompanyProfileItem> {}

const CompanyProfile = () => {
  const statistics: ICompanyProfileItems = [
    {
      total: 'Trial',
      description: 'Status'
    },
    {
      total: '10,000',
      description: 'Query runs'
    },
    {
      total: 'Unlimited',
      description: 'API calls'
    },
    {
      total: '$99.00',
      description: 'Price'
    },
    {
      total: '17 Aug, 2024',
      description: 'Next bill date'
    }
  ];

  const group: IAvatarsItems = [
    { filename: '300-4.png', variant: 'size-6' },
    { filename: '300-1.png', variant: 'size-6' },
    { filename: '300-2.png', variant: 'size-6' },
    {
      fallback: '+16',
      variant: 'text-primary-inverse size-6 ring-success-light bg-success'
    }
  ];

  const renderItem = (statistic: ICompanyProfileItem, index: number) => {
    return (
      <div
        key={index}
        className="flex flex-col gap-1.5 px-2.75 py-2.25 border border-dashed border-gray-400 rounded-md"
      >
        <span className="text-gray-900 text-sm leading-none font-medium">{statistic.total}</span>
        <span className="text-gray-700 text-xs">{statistic.description}</span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-body lg:py-7.5">
        <div className="flex flex-wrap gap-7.5">
          <div className="flex flex-col gap-3 items-center justify-center size-[140px] rounded-xl ring-1 ring-gray-200 bg-secondary-clarity">
            <img
              src={toAbsoluteUrl('/media/brand-logos/cloud-one.svg')}
              className="size-[70px]"
              alt=""
            />
            <span className="text-sm font-semibold text-gray-900">Cloud One</span>
          </div>
          <div className="flex flex-col gap-5 lg:gap-7.5 grow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-semibold text-gray-900">Cloud One Enterprise</h2>
                  <span className="badge badge-sm badge-success badge-outline">Monthly Plan</span>
                </div>
                <p className="text-2sm text-gray-700">
                  Essential Features for Startups and Individuals
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <a href="#" className="btn btn-sm btn-light">
                  Cancel Plan
                </a>
                <a href="#" className="btn btn-sm btn-primary">
                  Upgrade Plan
                </a>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3 lg:gap-5">
              {statistics.map((statistic, index) => {
                return renderItem(statistic, index);
              })}
            </div>

            <div className="flex flex-wrap gap-6 lg:gap-12">
              <div className="flex flex-col gap-3.5 grow">
                <div className="text-2sm text-gray-600">
                  UQuery runs:&nbsp;
                  <span className="text-2sm font-medium text-gray-900">2239 of 10,000 used</span>
                </div>
                <div className="progress progress-primary max-w-2xl w-full">
                  <div className="progress-bar" style={{ width: '47%' }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 lg:min-w-24 shrink-0 -mt-3 max-w-auto">
                <div className="text-2sm font-medium text-gray-600">
                  Seats:&nbsp;
                  <span className="text-2sm font-semibold text-gray-800">29 of 120 used</span>
                </div>
                <CommonAvatars group={group} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CompanyProfile, type ICompanyProfileItem, type ICompanyProfileItems };
