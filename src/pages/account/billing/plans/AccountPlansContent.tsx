import { MiscFaq, MiscHelp } from '@/partials/misc';

import { Plans } from './blocks';

const AccountPlansContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Plans />

      <MiscFaq />

      <MiscHelp />
    </div>
  );
};

export { AccountPlansContent };
