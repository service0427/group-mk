import { MiscFaq, MiscHelp2 } from '@/partials/misc';

import { InvitePeople, InviteWithLink, Members } from './blocks';

const AccountTeamMembersContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Members />

      <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
        <InvitePeople />

        <InviteWithLink />
      </div>

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { AccountTeamMembersContent };
