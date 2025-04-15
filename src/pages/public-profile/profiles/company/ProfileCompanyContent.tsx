import { Connections, Contributions, Projects, Tags } from '../default';
import {
  Statistics,
  Highlights,
  OpenJobs,
  Network,
  CompanyProfile,
  Locations,
  IStatisticsItems,
  INetworkItems
} from './blocks';

const ProfileCompanyContent = () => {
  const items: IStatisticsItems = [
    { number: '624', label: 'Employees' },
    { number: '60.7M', label: 'Users' },
    { number: '369M', label: 'Revenue' },
    { number: '27', label: 'Company Rank' }
  ];

  const data: INetworkItems = [
    { icon: 'dribbble', link: 'https://duolingo.com' },
    { icon: 'sms', link: 'info@duolingo.com' },
    { icon: 'facebook', link: 'duolingo' },
    { icon: 'twitter', link: 'duolingo-news' },
    { icon: 'youtube', link: 'duolingo-tuts' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-1 lg:col-span-3">
        <Statistics items={items} />
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <Highlights />

          <OpenJobs />

          <Network title="Network" data={data} />

          <Tags title="Tags" />
        </div>
      </div>
      <div className="col-span-1 lg:col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <CompanyProfile />

          <Locations />

          <Projects />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
            <Connections title="Members" />

            <Contributions title="Investments" />
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProfileCompanyContent };
