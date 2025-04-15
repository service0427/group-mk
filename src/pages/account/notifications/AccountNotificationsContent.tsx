import { Fragment } from 'react';

import { MiscEngage, MiscFaq, MiscHighlightedPosts, IHighlightedPostsItems } from '@/partials/misc';
import { toAbsoluteUrl } from '@/utils';

import { Channels, DoNotDistrub, OtherNotifications } from './blocks';

const AccountNotificationsContent = () => {
  const posts: IHighlightedPostsItems = [
    {
      icon: 'notification-on',
      title: 'Streamlined Alerts Setup: Custom Notification Preferences',
      summary:
        'Tailor your alert preferences with our streamlined setup. Stay informed with notifications that matter to you most.',
      path: '#'
    },
    {
      icon: 'message-notify',
      title: 'Effective Communication: Instant Notification Tools',
      summary:
        'Ensure timely communication with our instant notification tools. Customize alerts to stay ahead in real-time collaboration.',
      path: '#'
    },
    {
      icon: 'notification-status',
      title: 'Personalized Updates: Smart Alert System',
      summary:
        'Control how you receive updates with our smart alert system. Personalize notifications for a more efficient workflow.',
      path: '#'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <Channels />

          <OtherNotifications />

          <MiscFaq />

          <MiscEngage
            title="Contact Support"
            description="Need assistance? Contact our support team for prompt, personalized help your queries & concerns."
            image={
              <Fragment>
                <img
                  src={toAbsoluteUrl('/media/illustrations/31.svg')}
                  className="dark:hidden max-h-[150px]"
                  alt=""
                />
                <img
                  src={toAbsoluteUrl('/media/illustrations/31-dark.svg')}
                  className="light:hidden max-h-[150px]"
                  alt=""
                />
              </Fragment>
            }
            more={{
              title: 'Contact Support',
              url: ''
            }}
          />
        </div>
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <DoNotDistrub />

          <MiscHighlightedPosts posts={posts} />
        </div>
      </div>
    </div>
  );
};

export { AccountNotificationsContent };
