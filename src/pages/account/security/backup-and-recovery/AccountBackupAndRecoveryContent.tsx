import { MiscFaq, MiscHighlightedPosts, IHighlightedPostsItems } from '@/partials/misc';

import { Backup, BackupSettings } from './blocks';

const AccountBackupAndRecoveryContent = () => {
  const posts: IHighlightedPostsItems = [
    {
      icon: 'book',
      title: 'Securing Data Integrity: Backup Recovery Systems',
      summary:
        'Safeguard your data with our resilient backup recovery solutions. Detailed guides and expert strategies provide the roadmap to robust data protection and swift recovery.',
      path: '#'
    },
    {
      icon: 'data',
      title: 'Restoration Assurance: Proactive Backup Resources',
      summary:
        'Prepare for the unexpected with proactive backup plans. Access our extensive resources for establishing a reliable recovery protocol, ensuring continuity and peace of mind.',
      path: '#'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <Backup />

          <MiscFaq />
        </div>
      </div>

      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <BackupSettings />

          <MiscHighlightedPosts posts={posts} />
        </div>
      </div>
    </div>
  );
};

export { AccountBackupAndRecoveryContent };
