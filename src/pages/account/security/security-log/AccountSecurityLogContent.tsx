import { MiscHelp } from '@/partials/misc';

import { SecurityLog } from './blocks';

const AccountSecurityLogContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <SecurityLog />

      <MiscHelp />
    </div>
  );
};

export { AccountSecurityLogContent };
