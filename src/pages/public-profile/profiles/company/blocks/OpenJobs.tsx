import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';

interface IOpenJobsItem {
  icon: string;
  link: string;
  desc: string;
  price: string;
}
interface IOpenJobsItems extends Array<IOpenJobsItem> {}

const OpenJobs = () => {
  const items: IOpenJobsItems = [
    {
      icon: 'chart-line-star',
      link: 'Data Science',
      desc: 'Data Science Ninja',
      price: '$80,000 - $110,000'
    },
    {
      icon: 'rocket',
      link: 'Exploration',
      desc: 'Galactic Guide Writer',
      price: '$45,000 - $60,000'
    },
    {
      icon: 'milk',
      link: 'Drinking Arts',
      desc: 'Taste',
      price: '$40,000 - $55,000'
    },
    {
      icon: 'abstract-44',
      link: 'Film Production',
      desc: 'Zombie Makeup Artist',
      price: ' $55,000 - $75,000'
    }
  ];

  const renderItems = (item: IOpenJobsItem, index: number) => {
    return (
      <div key={index} className="flex align-start gap-3.5">
        <div className="flex items-center justify-center w-[1.875rem] h-[1.875rem] bg-gray-100 rounded-lg border border-gray-300">
          <KeenIcon icon={item.icon} className="text-base text-gray-600" />
        </div>
        <div className="flex flex-col">
          <a href="#" className="text-sm font-semibold leading-none link mb-1">
            {item.link}
          </a>
          <span className="text-sm font-medium text-gray-900">{item.desc}</span>
          <span className="text-xs text-gray-700">{item.price}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Open Jobs</h3>
      </div>

      <div className="card-body">
        <div className="grid gap-5">
          {items.map((item, index) => {
            return renderItems(item, index);
          })}
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to="/public-profile/works" className="btn btn-link">
          View & Apply
        </Link>
      </div>
    </div>
  );
};

export { OpenJobs, type IOpenJobsItem, type IOpenJobsItems };
