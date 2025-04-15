import React from 'react';

import { toAbsoluteUrl } from '@/utils/Assets';

interface IStatisticsItem {
  image: string;
  number: string;
  label: string;
}
interface IStatisticsItems extends Array<IStatisticsItem> {}

interface IStatisticsProps {
  details: IStatisticsItem[];
}

const Statistics = ({ details }: IStatisticsProps) => {
  const renderData = (item: IStatisticsItem, index: number) => {
    return (
      <React.Fragment key={index}>
        <div className="grid md:flex-1">
          <div className="flex justify-self-center items-center gap-3">
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${item.image}`)}
              className="h-10 max-w-full"
              alt=""
            />

            <div className="grid grid-cols-1 place-content-center flex-1">
              <span className="text-gray-900 text-2xl lg:text-2.5xl font-semibold">
                {item.number}
              </span>
              <span className="text-gray-700 text-sm">{item.label}</span>
            </div>
          </div>
        </div>

        <span className="[&:not(:last-child)]:border-e border-e-gray-300 my-1"></span>
      </React.Fragment>
    );
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-wrap px-5 lg:px-10 py-1 gap-2">
          {details.map((item, index) => {
            return renderData(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Statistics, type IStatisticsItem, type IStatisticsItems, type IStatisticsProps };
