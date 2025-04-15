import { MiscFaq, MiscHelp2 } from '@/partials/misc';

import { Teams } from './blocks';

const AccountTeamsContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Teams />

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { AccountTeamsContent };
