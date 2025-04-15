import { MiscFaq, MiscHelp2 } from '@/partials/misc';
import { Visitors } from './blocks/visitors';

const NetworkVisitorsContent = () => {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Visitors />

      <MiscFaq />

      <MiscHelp2 />
    </div>
  );
};

export { NetworkVisitorsContent };
