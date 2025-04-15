import { Fragment } from 'react';

import { Options, IOptionsItems } from './blocks';

const AccountGetStartedContent = () => {
  const items: IOptionsItems = [
    {
      icon: 'badge',
      title: 'Personal info',
      desc: "We're open to partnerships, guest posts, promo bannersand more.",
      path: '/account/members/team-info'
    },
    {
      icon: 'security-user',
      title: 'Login & Security',
      desc: 'Safeguarding your information with strong authentication measures.',
      path: '/account/security/security-log'
    },
    {
      icon: 'cheque',
      title: 'Billing & Payments',
      desc: 'Simplify payments today with secure, user-friendly transaction processes.',
      path: 'account/billing/basic'
    },
    {
      icon: 'notification-on',
      title: 'Notifications',
      desc: 'Keep updated with important notices and event reminders.',
      path: '/account/notifications'
    },
    {
      icon: 'dropbox',
      title: 'Integrations',
      desc: 'Enhance Workflows with Advanced Integrations.',
      path: '/account/integrations'
    },
    {
      icon: 'user',
      title: 'Members, Teams & Roles',
      desc: 'Efficient management of members, teams, and roles.',
      path: '/account/members/roles'
    },
    {
      icon: 'key-square',
      title: 'API Keys',
      desc: 'Secure and manage Your API Keys effectively and efficiently.',
      path: '/account/api-keys'
    },
    {
      icon: 'mouse-square',
      title: 'Appearance',
      desc: 'Transforming your online presence with flawless appearance.',
      path: '/account/appearance'
    },
    {
      icon: 'desktop-mobile',
      title: 'Devices',
      desc: 'Stay ahead with the latest devices and innovations news',
      path: '#'
    },
    {
      icon: 'color-swatch',
      title: 'Brand',
      desc: 'Trending brand designs, identities, and logos.',
      path: '/account/invite-a-friend'
    },
    {
      icon: 'chart-line-star',
      title: 'Activity',
      desc: 'Central Hub for Personal Customization.',
      path: '/account/activity'
    }
  ];

  return (
    <Fragment>
      <Options items={items} dropdown={true} />

      <div className="flex grow justify-center pt-5 lg:pt-7.5">
        <a href="#" className="btn btn-link">
          More Account Options
        </a>
      </div>
    </Fragment>
  );
};

export { AccountGetStartedContent };
