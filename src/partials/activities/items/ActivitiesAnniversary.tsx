import { Link } from 'react-router-dom';

import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesAnniversary = () => {
  return (
    <TimelinesWrapper icon="cup" line={false} removeSpace={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          We recently
          <Link to="/public-profile/profiles/nft" className="text-sm font-medium link">
            &nbsp;celebrated&nbsp;
          </Link>
          the blog&apos;s 1-year anniversary
        </div>
        <span className="text-xs text-gray-600">3 months ago, 4:07 PM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesAnniversary };
