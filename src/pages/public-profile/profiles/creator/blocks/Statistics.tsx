import React from 'react';

interface IStatisticsItem {
  value: string;
  title: string;
}
interface IStatisticsItems extends Array<IStatisticsItem> {}

interface IStatisticsProps {
  data: IStatisticsItem[];
}

const Statistics = ({ data }: IStatisticsProps) => {
  const renderData = (item: IStatisticsItem, index: number) => {
    return (
      <React.Fragment key={index}>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-gray-900 text-2xl lg:text-2.5xl font-semibold">{item.value}</span>
          <span className="text-gray-700 text-sm font-normal">{item.title}</span>
        </div>

        {index === 0 && <span className="sm:ms-8 sm:ps-8 border-s border-s-gray-200"></span>}
      </React.Fragment>
    );
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-wrap justify-center gap-2 py-1">
          {data.map((item, index) => {
            return renderData(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { Statistics, type IStatisticsItem, type IStatisticsItems, type IStatisticsProps };
