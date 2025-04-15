import { Fragment } from 'react';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';

interface ILikesItem {
  avatar: string;
  name: string;
  subscribers: number;
  connected: boolean;
}
interface ILikesItems extends Array<ILikesItem> {}

const Likes = () => {
  const items: ILikesItems = [
    {
      avatar: '300-14.png',
      name: 'Adam Wilson ',
      subscribers: 2,
      connected: false
    },
    {
      avatar: '300-7.png',
      name: 'Renee Branson',
      subscribers: 6,
      connected: true
    },
    {
      avatar: '300-32.png',
      name: 'Jonathan Taylor',
      subscribers: 13,
      connected: false
    },
    {
      avatar: '300-15.png',
      name: 'Lilia Mattox',
      subscribers: 4,
      connected: true
    },
    {
      avatar: '300-25.png',
      name: 'Neil Roberts',
      subscribers: 23,
      connected: true
    }
  ];

  const renderItem = (item: ILikesItem, index: number) => {
    return (
      <div key={index} className="flex items-center flex-wrap gap-2">
        <div className="flex items-center grow gap-2.5">
          <img
            src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
            className="rounded-full size-10 shrink-0"
            alt=""
          />

          <div className="flex flex-col">
            <a
              href="#"
              className="text-md font-medium text-gray-900 hover:text-primary-active mb-px"
            >
              {item.name}
            </a>
            <span className="text-2sm text-gray-700">{item.subscribers} mutual subscribers</span>
          </div>
        </div>

        {item.connected ? (
          <a className="btn btn-light btn-sm">
            <KeenIcon icon="check-circle" /> Connected
          </a>
        ) : (
          <a className="btn btn-sm btn-primary">
            <KeenIcon icon="people" /> Connect
          </a>
        )}
      </div>
    );
  };

  return (
    <Fragment>
      <div className="flex flex-col gap-2 lg:gap-5 pt-3.5 px-7.5 mb-5">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>

      <div className="card-footer justify-center">
        <a href="#" className="btn btn-link">
          Show more Likes
        </a>
      </div>
    </Fragment>
  );
};

export { Likes, type ILikesItem, type ILikesItems };
