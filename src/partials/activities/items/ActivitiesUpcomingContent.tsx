import { Link } from 'react-router-dom';

import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesUpcomingContent = () => {
  return (
    <TimelinesWrapper icon="share" line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          I couldn&apos;t resist sharing a sneak peek of our
          <Link to="/public-profile/profiles/blogger" className="text-sm link">
            &nbsp;upcoming content
          </Link>
        </div>
        <span className="text-xs text-gray-600">5 days ago, 4:07 PM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesUpcomingContent };
