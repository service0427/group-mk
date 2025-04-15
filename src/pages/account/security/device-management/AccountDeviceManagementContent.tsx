import { MiscHelp } from '@/partials/misc';

import { Device } from './blocks';

const AccountDeviceManagementContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Device />

      <MiscHelp />
    </div>
  );
};

export { AccountDeviceManagementContent };
