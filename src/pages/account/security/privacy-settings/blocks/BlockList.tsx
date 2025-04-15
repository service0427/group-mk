import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import clsx from 'clsx';

import { CommonAvatar } from '@/partials/common';

interface IBlockListItem {
  avatar: string;
  name: string;
  commits: number;
}
interface IBlockListItems extends Array<IBlockListItem> {}

interface IBlockListProps {
  text: string;
  limit?: number;
  className?: string;
}

const BlockList = ({ text, limit, className }: IBlockListProps) => {
  const items: IBlockListItems = [
    {
      avatar: 'gray/1.png',
      name: 'Esther Howard',
      commits: 6
    },
    {
      avatar: 'gray/2.png',
      name: 'Tyler Hero',
      commits: 29
    },
    {
      avatar: 'gray/3.png',
      name: 'Arlene McCoy',
      commits: 34
    },
    {
      avatar: 'gray/4.png',
      name: 'Cody Fisher',
      commits: 1
    }
  ];

  const renderItem = (item: IBlockListItem, index: number) => {
    return (
      <div key={index} className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <CommonAvatar image={item.avatar} imageClass="h-9 rounded-full" />

          <div className="flex flex-col gap-0.5">
            <Link
              to="/public-profile/teams"
              className="flex items-center gap-1.5 leading-none font-medium text-sm text-gray-900 hover:text-primary"
            >
              {item.name}
            </Link>
            <span className="text-2sm text-gray-700">
              {item.commits} commit{item.commits > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a href="#" className="btn btn-sm btn-icon btn-clear btn-light">
            <KeenIcon icon="trash" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className={clsx('card', className && className)}>
      <div className="card-header">
        <h3 className="card-title">Block List</h3>
      </div>
      <div className="card-body flex flex-col gap-5">
        <div className="text-sm text-gray-800">{text}</div>

        <div className="input-group">
          <input className="input" placeholder="Block new user" type="text" />
          <span className="btn btn-primary">Add</span>
        </div>

        <div className="flex flex-col gap-5">
          {items.map((item, index) => {
            if (limit === undefined || index < limit) {
              return renderItem(item, index);
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export { BlockList, type IBlockListItem, type IBlockListItems, type IBlockListProps };
