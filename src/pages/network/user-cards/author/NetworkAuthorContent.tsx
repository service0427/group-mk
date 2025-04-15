import { useState } from 'react';
import { KeenIcon } from '@/components';
import { CardAuthor, CardAuthorRow } from '@/partials/cards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface IAuthorContentAvatar {
  className: string;
  image: string;
  imageClass: string;
  badgeClass: string;
}

interface IAuthorContentWork {
  image: string;
  title: string;
  id: number;
}

interface IAuthorContentItem {
  avatar: IAuthorContentAvatar;
  bgImage: string;
  name: string;
  location: string;
  url?: string;
  works: IAuthorContentWork[];
}
interface IAuthorContentItems extends Array<IAuthorContentItem> {}

const NetworkAuthorContent = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [searchInput, setSearchInput] = useState('');

  const handleTabClick = (tab: 'cards' | 'list') => {
    setActiveTab(tab);
  };

  const items: IAuthorContentItems = [
    {
      avatar: {
        className: 'size-[120px] [.authors-row_&]:size-[80px] shrink-0 relative',
        image: '300-1.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-3 bg-success rounded-full ring-2 ring-light absolute bottom-2 start-[93px] [.authors-row_&]:start-[64px]'
      },
      bgImage: 'bg-7.png',
      name: 'Jenny Klabber',
      location: 'Houston, Texas',
      url: '#',
      works: [
        {
          image: '6.jpg',
          title: 'Geometric Patterns',
          id: 81023
        },
        {
          image: '7.jpg',
          title: 'Artistic Expressions',
          id: 67890
        },
        {
          image: '24.jpg',
          title: 'Duolingo Tech Hub',
          id: 59374
        },
        {
          image: '27.jpg',
          title: 'Duolingo Language',
          id: 34214
        }
      ]
    },
    {
      avatar: {
        className: 'size-[120px] [.authors-row_&]:size-[80px] shrink-0 relative',
        image: '300-3.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-3 bg-success rounded-full ring-2 ring-light absolute bottom-2 start-[93px] [.authors-row_&]:start-[64px]'
      },
      bgImage: 'bg-8.png',
      name: 'Ralph Edwards',
      location: 'Sacramento, California',
      url: '',
      works: [
        {
          image: '1.jpg',
          title: 'Geometric Patterns',
          id: 98472
        },
        {
          image: '25.jpg',
          title: 'Artistic Expressions',
          id: 20194
        },
        {
          image: '3.jpg',
          title: 'Geometric Patterns',
          id: 37649
        },
        {
          image: '5.jpg',
          title: 'Geometric Patterns',
          id: 47264
        }
      ]
    },
    {
      avatar: {
        className: 'size-[120px] [.authors-row_&]:size-[80px] shrink-0 relative',
        image: '300-17.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-3 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-2 start-[93px] [.authors-row_&]:start-[64px]'
      },
      bgImage: 'bg-9.png',
      name: 'Jacob Jones',
      location: 'Boston, Massachusetts',
      url: '',
      works: [
        {
          image: '27.jpg',
          title: 'Geometric Patterns',
          id: 20495
        },
        {
          image: '28.jpg',
          title: 'Artistic Expressions',
          id: 73651
        },
        {
          image: '29.jpg',
          title: 'Geometric Patterns',
          id: 19482
        },
        {
          image: '5.jpg',
          title: 'Geometric Patterns',
          id: 39184
        }
      ]
    },
    {
      avatar: {
        className: 'size-[120px] [.authors-row_&]:size-[80px] shrink-0 relative',
        image: '300-5.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-3 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-2 start-[93px] [.authors-row_&]:start-[64px]'
      },
      bgImage: 'bg-10.png',
      name: 'Kristin Watson',
      location: 'Cleveland, Ohio',
      url: '',
      works: [
        {
          image: '30.jpg',
          title: 'Geometric Patterns',
          id: 10382
        },
        {
          image: '31.jpg',
          title: 'Artistic Expressions',
          id: 49273
        },
        {
          image: '32.jpg',
          title: 'Geometric Patterns',
          id: 39104
        },
        {
          image: '5.jpg',
          title: 'Geometric Patterns',
          id: 49183
        }
      ]
    }
  ];

  const renderCard = (item: IAuthorContentItem, index: number) => (
    <CardAuthor
      avatar={item.avatar}
      bgImage={item.bgImage}
      name={item.name}
      location={item.location}
      works={item.works}
      key={index}
    />
  );

  const renderListItem = (item: IAuthorContentItem, index: number) => (
    <CardAuthorRow
      avatar={item.avatar}
      bgImage={item.bgImage}
      name={item.name}
      location={item.location}
      works={item.works}
      key={index}
    />
  );

  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-md text-gray-900 font-medium">Showing {items.length} Users</h3>

        <div className="flex items-center flex-wrap gap-5">
          <div className="flex items-center gap-2.5">
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
              data-tab-toggle="#author_cards"
            >
              <KeenIcon icon="category" />
            </a>
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => handleTabClick('list')}
              data-tab-toggle="#author_list"
            >
              <KeenIcon icon="row-horizontal" />
            </a>
          </div>
        </div>
      </div>

      {activeTab === 'cards' ? (
        <div id="author_cards" className="flex flex-col gap-5 lg:gap-7.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
            {items.map((item: any, index: number) => {
              return renderCard(item, index);
            })}
          </div>

          <div className="flex justify-center">
            <a href="#" className="btn btn-link">
              Show more Users
            </a>
          </div>
        </div>
      ) : (
        <div className="authors-row" id="author_list">
          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            {items.map((item: any, index: number) => {
              return renderListItem(item, index);
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

export { NetworkAuthorContent, type IAuthorContentItem, type IAuthorContentItems };
