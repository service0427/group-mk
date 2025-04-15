import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { CardUserMini } from '@/partials/cards';
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

interface IMiniCardsContentItem {
  avatar: IAvatar;
  name: string;
  email: string;
  verify: boolean;
}
interface IMiniCardsContentItems extends Array<IMiniCardsContentItem> {}

const NetworkMiniCardsContent = () => {
  const [searchInput, setSearchInput] = useState('');

  const items: IMiniCardsContentItems = [
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-1.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jenny Klabber',
      email: 'starlight.eth',
      verify: true
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-info size-20 ring-1 ring-info-clarity bg-info-light rounded-full',
        fallback: 'S',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Sarah Johnson',
      email: 'sarahjohnson.eth',
      verify: false
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-success size-20 ring-1 ring-success-clarity bg-success-light rounded-full',
        fallback: 'M',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Megan Tayloy',
      email: 'megantaylor.eth',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-8.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Alex Martines',
      email: 'amartnes.eth',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-9.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Brian Davis',
      email: 'briandavis.eth',
      verify: true
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-danger size-20 ring-1 ring-danger-clarity bg-danger-light rounded-full',
        fallback: 'k',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Kevin Wong',
      email: 'kevinwong.eth',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-5.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jenny Wilson',
      email: 'jennyklabber.eth',
      verify: false
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-4.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Robert Fox',
      email: 'roberfox.eth',
      verify: false
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-primary size-20 ring-1 ring-primary-clarity bg-primary-light rounded-full',
        fallback: 'B',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Bessie Cooper',
      email: 'bscoop.eth',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-13.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Eleanor Pena',
      email: 'pena_707.eth',
      verify: false
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-23.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Darlene Robertson',
      email: 'msfoxy.eth',
      verify: true
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-warning size-20 ring-1 ring-warning-clarity bg-warning-light rounded-full',
        fallback: 'J',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Jerome Bell',
      email: 'nbatrends.eth',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-3.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Devon Lane',
      email: 'notabooker.eth',
      verify: true
    },
    {
      avatar: {
        className: 'size-20 relative',
        image: '300-11.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Ralph Edwards',
      email: 'lorenstore.eth',
      verify: true
    },
    {
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-success size-20 ring-1 ring-success-clarity bg-success-light rounded-full',
        fallback: 'T',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      name: 'Theresa Webb',
      email: 'betterthanvettel.eth',
      verify: false
    }
  ];

  const renderItem = (item: IMiniCardsContentItem, index: number) => (
    <CardUserMini
      avatar={item.avatar}
      name={item.name}
      email={item.email}
      verify={item.verify}
      key={index}
    />
  );

  return (
    <Fragment>
      <div className="flex items-center justify-between gap-2.5 flex-wrap mb-7.5">
        <h3 className="text-md text-gray-900 font-medium">Showing {items.length} Users</h3>

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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-7.5">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>

      <div className="flex grow justify-center pt-5 lg:pt-7.5">
        <Link to="/account/home/user-profile" className="btn btn-link">
          Show more Users
        </Link>
      </div>
    </Fragment>
  );
};

export { NetworkMiniCardsContent, type IMiniCardsContentItem, type IMiniCardsContentItems };
