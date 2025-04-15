import { Users } from './blocks/users';
import { MiscFaq, MiscHelp2 } from '@/partials/misc';

const NetworkMarketAuthorsContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Users />

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { NetworkMarketAuthorsContent };
