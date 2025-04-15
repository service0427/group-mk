import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';

interface IOptionsItem {
  title: string;
  icon: string;
  desc: string;
  path: string;
}
interface IOptionsItems extends Array<IOptionsItem> {}

const Options = () => {
  const items: IOptionsItems = [
    {
      title: 'Seats',
      icon: 'badge',
      desc: 'Central hub for users: view data, change settings, see activity logs',
      path: '/account/members/team-info'
    },
    {
      title: 'Login & Security',
      icon: 'security-user',
      desc: 'Set passwords, enable 2FA, view login logs, update security questions',
      path: '/account/security/security-log'
    }
  ];

  const renderItem = (item: IOptionsItem, index: number) => {
    return (
      <div
        key={index}
        className="card px-5 lg:px-7.5 h-full bg-[length:85%] [background-position:7.5rem_-3.5rem] bg-no-repeat channel-stats-bg"
      >
        <div className="flex flex-col gap-4 pt-6">
          <KeenIcon icon={item.icon} className="text-2xl text-gray-600" />

          <div className="flex flex-col gap-2.5 mb-2">
            <Link
              to={`${item.path}`}
              className="text-base font-semibold leading-none text-gray-900 hover:text-primary-active"
            >
              {item.title}
            </Link>
            <span className="text-2sm font-medium text-gray-600 leading-5">{item.desc}</span>
          </div>
        </div>

        <div className="flex mb-4 items-center gap-1 cursor-pointer">
          <Link
            to="/public-profile/network"
            className="btn text-primary hover:text-primary-active px-0"
          >
            View page
          </Link>
          <KeenIcon icon="right" className="text-primary text-xs rtl:transform rtl:rotate-180" />
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      <style>
        {`
          .channel-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3.png')}');
          }
          .dark .channel-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3-dark.png')}');
          }
        `}
      </style>

      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </Fragment>
  );
};

export { Options, type IOptionsItem, type IOptionsItems };
