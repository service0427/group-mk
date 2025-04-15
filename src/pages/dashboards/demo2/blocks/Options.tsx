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
      title: 'Personal info',
      icon: 'badge',
      desc: 'Central hub for users: view data, change settings, see activity logs, manage tasks, read notes, get alerts, and more',
      path: '/account/members/team-info'
    },
    {
      title: 'Login & Security',
      icon: 'security-user',
      desc: 'Set passwords, enable 2FA, view login logs, update security questions, track account activity for better safety',
      path: '/account/security/security-log'
    },
    {
      title: 'Billing & Payments',
      icon: 'cheque',
      desc: 'Manage billing info, update payment methods, view transaction history, set up autopay, and track expenses easily',
      path: '/account/billing/basic'
    },
    {
      title: 'Members, Teams & Roles',
      icon: 'users',
      desc: 'Manage members, assign roles, create teams, update permissions, view activity logs, and streamline team collaboration',
      path: '/account/members/roles'
    }
  ];

  const renderItem = (item: IOptionsItem, index: number) => {
    return (
      <div
        key={index}
        className="card px-5 lg:px-7.5 h-full bg-[length:85%] [background-position:9rem_-4rem] rtl:[background-position:-4rem_-4rem] bg-no-repeat channel-stats-bg"
      >
        <div className="flex flex-col gap-4 pt-6">
          <KeenIcon icon={item.icon} className="text-2xl text-gray-600" />

          <div className="flex flex-col gap-2.5 mb-2">
            <h3 className="text-base font-medium leading-none text-gray-900">{item.title}</h3>
            <span className="text-2sm text-gray-800 leading-5">{item.desc}</span>
          </div>
        </div>

        <div className="flex mb-4 items-center gap-1 cursor-pointer">
          <Link to={`${item.path}`} className="btn text-primary hover:text-primary-active px-0">
            View page
          </Link>
          <KeenIcon icon="right" className="text-primary text-xs" />
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
