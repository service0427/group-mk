import { Fragment } from 'react';

import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';

import { MiscEngage, MiscFaq, MiscHighlightedPosts, IHighlightedPostsItems } from '@/partials/misc';

import { ExternalServicesManageApi } from '../home/settings-sidebar';
import { DoNotDistrub } from '../notifications';
import { ApiIntegrations, Webhooks } from './blocks';

const AccountApiKeysContent = () => {
  const posts: IHighlightedPostsItems = [
    {
      icon: 'cloud-add',
      title: 'Streamlined Alerts Setup: Custom Notification Preferences',
      summary:
        'Easily integrate and manage your APIs with our suite of configuration tools. Gain access to extensive instructions, expert support, and in-depth documentation to keep your API interactions efficient and up-to-date..',
      path: '#'
    },
    {
      icon: 'icon',
      title: 'Enhancing Connectivity: Tools for API Expansion',
      summary:
        'Leverage the full potential of your APIs with our advanced expansion tools. We provide all the necessary resources for easy setup, information exchange, and maintaining high-performance API connectivity.',
      path: '#'
    },
    {
      icon: 'subtitle',
      title: 'Organizing Team Data: Efficient Roster Solutions',
      summary:
        'Organize your API data more with our detailed interface solutions. From quick setup guides to management, our tools are designed to streamline every step of your API data organization.',
      path: '#'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <ExternalServicesManageApi title="Public API Key" switch={true} />

          <ApiIntegrations />

          <Webhooks />

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
          <DoNotDistrub
            title="Project API keys"
            icon={<KeenIcon icon="note-2" className="text-gray-300" />}
            text="Client Docs"
          />

          <MiscHighlightedPosts posts={posts} />
        </div>
      </div>
    </div>
  );
};

export { AccountApiKeysContent };
