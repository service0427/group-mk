import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { CardConnection, CardConnectionRow } from '@/partials/cards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface ITeamCrewAvatar {
  className: string;
  image?: string;
  imageClass?: string;
  fallback?: string;
  badgeClass: string;
}

interface ITeamCrewGroup {
  filename: string;
}

interface ITeamCrewTeam {
  size: string;
  group: ITeamCrewGroup[];
  more?: {
    number: number;
    variant: string;
  };
}

interface ITeamCrewStatistic {
  total: string;
  description: string;
}

interface ITeamCrewContentItem {
  name: string;
  info: string;
  avatar: ITeamCrewAvatar;
  email: string;
  team: ITeamCrewTeam;
  statistics: ITeamCrewStatistic[];
  connected: boolean;
}
interface ITeamCrewContentItems extends Array<ITeamCrewContentItem> {}

const NetworkUserCardsTeamCrewContent = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [searchInput, setSearchInput] = useState('');

  const handleTabClick = (tab: 'cards' | 'list') => {
    setActiveTab(tab);
  };

  const items: ITeamCrewContentItems = [
    {
      name: 'Jenny Klabber',
      info: 'Pinnacle Innovate',
      avatar: {
        className: 'size-20 relative',
        image: '300-1.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      email: 'kevin@pinnacle.com',
      team: {
        size: 'size-7',
        group: [{ filename: '300-4.png' }, { filename: '300-1.png' }, { filename: '300-2.png' }],
        more: {
          number: 10,
          variant: 'text-success-inverse ring-success-light bg-success'
        }
      },
      statistics: [
        {
          total: '92',
          description: 'Purchases'
        },
        {
          total: '$69',
          description: 'Avg. Price'
        },
        {
          total: '$6,240',
          description: 'Total spent'
        }
      ],
      connected: true
    },
    {
      name: 'Sarah Johnson',
      info: 'InnovateX',
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-info size-20 ring-1 ring-info-clarity bg-info-light rounded-full',
        fallback: 'S',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      email: 'sarahj@innx.com',
      team: {
        size: 'size-7',
        group: [
          { filename: '300-5.png' },
          { filename: '300-6.png' },
          { filename: '300-7.png' },
          { filename: '300-11.png' }
        ]
      },
      statistics: [
        {
          total: '123',
          description: 'Purchases'
        },
        {
          total: '$30',
          description: 'Avg. Price'
        },
        {
          total: '$3,713',
          description: 'Total spent'
        }
      ],
      connected: false
    },
    {
      name: 'Kevin Wang',
      info: 'Pinnacle Innovate',
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-danger size-20 ring-1 ring-danger-clarity bg-danger-light rounded-full',
        fallback: 'K',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      email: 'kevin@pinnacle.com',
      team: {
        size: 'size-7',
        group: [
          { filename: '300-29.png' },
          { filename: '300-33.png' },
          { filename: '300-23.png' },
          { filename: '300-31.png' }
        ]
      },
      statistics: [
        {
          total: '30',
          description: 'Purchases'
        },
        {
          total: '$150',
          description: 'Avg. Price'
        },
        {
          total: '$4,500',
          description: 'Total spent'
        }
      ],
      connected: true
    },
    {
      name: 'Brian Davis',
      info: 'Vortex Tech',
      avatar: {
        className: 'size-20 relative',
        image: '300-9.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      email: 'brian@vortextech.com',
      team: {
        size: 'size-7',
        group: [
          { filename: '300-14.png' },
          { filename: '300-3.png' },
          { filename: '300-19.png' },
          { filename: '300-15.png' }
        ]
      },
      statistics: [
        {
          total: '87',
          description: 'Purchases'
        },
        {
          total: '$22',
          description: 'Avg. Price'
        },
        {
          total: '$1958',
          description: 'Total spent'
        }
      ],
      connected: true
    },
    {
      name: 'Megan Taylor',
      info: 'Catalyst',
      avatar: {
        className:
          'flex items-center justify-center relative text-2.5xl text-success size-20 ring-1 ring-success-clarity bg-success-light rounded-full',
        fallback: 'M',
        badgeClass:
          'flex size-2.5 bg-gray-400 rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      email: 'megan@catalyst.com',
      team: {
        size: 'size-7',
        group: [
          { filename: '300-5.png' },
          { filename: '300-26.png' },
          { filename: '300-6.png' },
          { filename: '300-1.png' }
        ]
      },
      statistics: [
        {
          total: '45',
          description: 'Purchases'
        },
        {
          total: '$300',
          description: 'Avg. Price'
        },
        {
          total: '$13,500',
          description: 'Total spent'
        }
      ],
      connected: false
    },
    {
      name: 'Alex Martinez',
      info: 'Precision Solutions',
      avatar: {
        className: 'size-20 relative',
        image: '300-8.png',
        imageClass: 'rounded-full',
        badgeClass:
          'flex size-2.5 bg-success rounded-full absolute bottom-0.5 start-16 transform -translate-y-1/2'
      },
      email: 'alex@kteam.com',
      team: {
        size: 'size-7',
        group: [{ filename: '300-4.png' }, { filename: '300-5.png' }, { filename: '300-11.png' }],
        more: {
          number: 10,
          variant: 'text-success-inverse ring-success-light bg-success'
        }
      },
      statistics: [
        {
          total: '63',
          description: 'Purchases'
        },
        {
          total: '$65',
          description: 'Avg. Price'
        },
        {
          total: '$4,095',
          description: 'Total spent'
        }
      ],
      connected: true
    }
  ];

  const renderItem = (item: ITeamCrewContentItem, index: number) => (
    <CardConnection
      name={item.name}
      info={item.info}
      avatar={item.avatar}
      email={item.email}
      team={item.team}
      statistics={item.statistics}
      connected={item.connected}
      key={index}
    />
  );

  const renderRowItem = (item: ITeamCrewContentItem, index: number) => (
    <CardConnectionRow
      name={item.name}
      info={item.info}
      avatar={item.avatar}
      email={item.email}
      team={item.team}
      statistics={item.statistics}
      connected={item.connected}
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
              data-tab-toggle="#team_crew_card"
            >
              <KeenIcon icon="category" />
            </a>
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => handleTabClick('list')}
              data-tab-toggle="#team_crew_list"
            >
              <KeenIcon icon="row-horizontal" />
            </a>
          </div>
        </div>
      </div>

      {activeTab === 'cards' ? (
        <div id="team_crew_card" className="flex flex-col gap-5 lg:gap-7.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderItem(item, index);
            })}
          </div>

          <div className="flex justify-center">
            <Link to="/public-profile/projects/3-columns" className="btn btn-link">
              Show more projects
            </Link>
          </div>
        </div>
      ) : (
        <div id="team_crew_list">
          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            {items.map((item, index) => {
              return renderRowItem(item, index);
            })}
          </div>

          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <Link to="/account/members/team-members" className="btn btn-link">
              Show more Users
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export { NetworkUserCardsTeamCrewContent, type ITeamCrewContentItem, type ITeamCrewContentItems };
