import { useState } from 'react';
import { KeenIcon } from '@/components';
import { CardUserSocial, CardUserSocialRow } from '@/partials/cards';
import { IAvatarProps } from '@/partials/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface ISocialContentItem {
  avatar: IAvatarProps;
  name: string;
  description: string;
  verify: boolean;
}
interface ISocialContentItems extends Array<ISocialContentItem> {}

const NetworkSocialContent = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [searchInput, setSearchInput] = useState('');

  const handleTabClick = (tab: 'cards' | 'list') => {
    setActiveTab(tab);
  };

  const items: ISocialContentItems = [
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-1.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jenny Klabber',
      description: 'San Antonio, TX',
      verify: true
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-danger size-20 ring-1 ring-danger-clarity bg-danger-light rounded-full',
        fallback: 'K',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Kevin Warren',
      description: 'Fort Wayne, IN',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-9.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Brian Davis',
      description: 'Reno, NV',
      verify: false
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-11.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Guy Hawkins',
      description: 'Irving, TX',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-30.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Albert Flores',
      description: 'Boise, ID',
      verify: false
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-info size-20 ring-1 ring-info-clarity bg-info-light rounded-full',
        fallback: 'S',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Savannah Nguyen',
      description: 'Spokane, WA',
      verify: true
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-success size-20 ring-1 ring-success-clarity bg-success-light rounded-full',
        fallback: 'M',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Marvin McKinney',
      description: 'Richmond, VA',
      verify: false
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-3.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Darrell Steward',
      description: 'Baton Rouge, LA',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-5.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Eleanor Pena',
      description: 'Des Moines, IA',
      verify: true
    }
  ];

  const renderItem = (item: ISocialContentItem, index: number) => (
    <CardUserSocial
      avatar={item.avatar}
      name={item.name}
      description={item.description}
      verify={item.verify}
      key={index}
    />
  );

  const renderRowItem = (item: ISocialContentItem, index: number) => (
    <CardUserSocialRow
      avatar={item.avatar}
      name={item.name}
      description={item.description}
      verify={item.verify}
      key={index}
    />
  );

  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-md text-gray-900 font-medium">Showing {items.length} Users</h3>

        <div className="flex items-center flex-wrap gap-5">
          <div className="flex items-center flex-wrap gap-2.5">
            <Select defaultValue="active">
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="w-32">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="latest">
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="w-32">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="older">Older</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

            <button className="btn btn-sm btn-outline btn-primary">
              <KeenIcon icon="setting-4" /> Filters
            </button>
          </div>

          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Type name, team"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
          </div>

          <div className="btn-tabs btn-tabs-sm" data-tabs="true">
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => handleTabClick('cards')}
              data-tab-toggle="#social_card"
            >
              <KeenIcon icon="category" />
            </a>
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => handleTabClick('list')}
              data-tab-toggle="#social_list"
            >
              <KeenIcon icon="row-horizontal" />
            </a>
          </div>
        </div>
      </div>

      {activeTab === 'cards' ? (
        <div id="social_card" className="flex flex-col gap-5 lg:gap-7.5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderItem(item, index);
            })}
          </div>

          <div className="flex justify-center">
            <a href="#" className="btn btn-link">
              Show more Users
            </a>
          </div>
        </div>
      ) : (
        <div id="social_list">
          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderRowItem(item, index);
            })}
          </div>

          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <a href="#" className="btn btn-link">
              Show more Users
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export { NetworkSocialContent, type ISocialContentItem, type ISocialContentItems };
