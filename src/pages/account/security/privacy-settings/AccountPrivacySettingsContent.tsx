import { MiscFaq, MiscHighlightedPosts, IHighlightedPostsItems } from '@/partials/misc';

import { BlockList, ManageData, PrivacySettings, ReportSettings } from './blocks';

const AccountPrivacySettingsContent = () => {
  const posts: IHighlightedPostsItems = [
    {
      icon: 'toggle-on-circle',
      title: 'Fortifying Privacy Controls: Customization and Guidelines',
      summary:
        'Enhance your privacy framework with customizable settings. Understand and apply robust controls with our comprehensive guidelines to protect member data.',
      path: '#'
    },
    {
      icon: 'setting',
      title: 'Navigating Privacy Preferences: Secure Configuration Tools',
      summary:
        'Take command of your privacy settings with our secure configuration tools. Detailed resources and expert insights ensure your preferences are set for maximum protection.',
      path: '#'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <PrivacySettings />

          <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
            <ReportSettings limit={3} />

            <ManageData />
          </div>

          <MiscFaq />
        </div>
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <BlockList text="Users on the block list are unable to send chat requests or messages to you." />

          <MiscHighlightedPosts posts={posts} />
        </div>
      </div>
    </div>
  );
};

export { AccountPrivacySettingsContent };
