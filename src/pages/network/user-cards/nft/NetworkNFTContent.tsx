import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { CardNFT2, CardNFT2Row } from '@/partials/cards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface IAvatar {
  className: string;
  image?: string;
  imageClass?: string;
  fallback?: string;
  badgeClass: string;
}

interface IStatistic {
  total: string;
  description: string;
}

interface INFTContentItem {
  name: string;
  info: string;
  avatar: IAvatar;
  email: string;
  statistics: IStatistic[];
  bgImage: string;
}
interface INFTContentItems extends Array<INFTContentItem> {}

const NetworkNFTContent = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [searchInput, setSearchInput] = useState('');

  const handleTabClick = (tab: 'cards' | 'list') => {
    setActiveTab(tab);
  };

  const items: INFTContentItems = [
    {
      bgImage: 'bg-11.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-1.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jenny Klabber',
      email: '@jenny',
      info: '0x4aD5..F89Aa',
      statistics: [
        {
          total: '196 ETH',
          description: 'Sales'
        },
        {
          total: '2972',
          description: 'Items'
        },
        {
          total: '5%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-12.png',
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-danger size-20 ring-1 ring-danger-clarity bg-danger-light rounded-full',
        fallback: 'K',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Kevin Warren',
      email: '@wadeart',
      info: '0x4aD5..b2b3D',
      statistics: [
        {
          total: '23 ETH',
          description: 'Sales'
        },
        {
          total: '82',
          description: 'Items'
        },
        {
          total: '2%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-7.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-12.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Guy Hawkins',
      email: '@hawkinsnyc',
      info: '@0x3eF8..7gF9B',
      statistics: [
        {
          total: '2508 ETH',
          description: 'Sales'
        },
        {
          total: '27k',
          description: 'Items'
        },
        {
          total: '57%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-10.png',
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-primary size-20 ring-1 ring-primary-clarity bg-primary-light rounded-full',
        fallback: 'B',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Bessie Lane',
      email: '@booker777',
      info: '0x1aC3..9kL2P',
      statistics: [
        {
          total: '4 ETH',
          description: 'Sales'
        },
        {
          total: '105',
          description: 'Items'
        },
        {
          total: '93%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-11.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-5.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Bessie Cooper',
      email: '@bessie_c',
      info: '0x9bD4..6hN3M',
      statistics: [
        {
          total: '123 ETH',
          description: 'Sales'
        },
        {
          total: '3123',
          description: 'Items'
        },
        {
          total: '7%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-8.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-2.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jerome Bell',
      email: '@jerome',
      info: '0x2gH5..4tR7U',
      statistics: [
        {
          total: '67 ETH',
          description: 'Sales'
        },
        {
          total: '904',
          description: 'Items'
        },
        {
          total: '46%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-8.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-14.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Floyd Miles',
      email: '@milesandwales',
      info: '0x8jK6..3qV1Z',
      statistics: [
        {
          total: '205 ETH',
          description: 'Sales'
        },
        {
          total: '2979',
          description: 'Items'
        },
        {
          total: '11%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-13.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-3.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Albert Flores',
      email: '@alberanstanton',
      info: '0x7lM2..5xW8Y',
      statistics: [
        {
          total: '2723 ETH',
          description: 'Sales'
        },
        {
          total: '306k',
          description: 'Items'
        },
        {
          total: '8%',
          description: 'Listed'
        }
      ]
    },
    {
      bgImage: 'bg-7.png',
      avatar: {
        className: 'size-20 shrink-0 relative',
        image: '300-17.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full ring-2 ring-light absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jacob Jones',
      email: '@jacobeth_99',
      info: '0x5nB3..0sG9Q',
      statistics: [
        {
          total: '2 ETH',
          description: 'Sales'
        },
        {
          total: '68',
          description: 'Items'
        },
        {
          total: '74%',
          description: 'Listed'
        }
      ]
    }
  ];

  const renderItem = (item: INFTContentItem, index: number) => (
    <CardNFT2
      bgImage={item.bgImage}
      avatar={item.avatar}
      name={item.name}
      email={item.email}
      info={item.info}
      statistics={item.statistics}
      key={index}
    />
  );

  const renderRowItem = (item: INFTContentItem, index: number) => (
    <CardNFT2Row
      bgImage={item.bgImage}
      avatar={item.avatar}
      name={item.name}
      email={item.email}
      info={item.info}
      statistics={item.statistics}
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
              data-tab-toggle="#network_cards"
            >
              <KeenIcon icon="category" />
            </a>
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => handleTabClick('list')}
              data-tab-toggle="#network_list"
            >
              <KeenIcon icon="row-horizontal" />
            </a>
          </div>
        </div>
      </div>

      {activeTab === 'cards' ? (
        <div id="network_cards">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderItem(item, index);
            })}
          </div>

          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <a href="#" className="btn btn-link">
              Show more Users
            </a>
          </div>
        </div>
      ) : (
        <div id="network_list">
          <div className="flex flex-col gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderRowItem(item, index);
            })}
          </div>

          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <Link to="/public-profile/profiles/nft" className="btn btn-link">
              Show more Users
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export { NetworkNFTContent, type INFTContentItem, type INFTContentItems };
