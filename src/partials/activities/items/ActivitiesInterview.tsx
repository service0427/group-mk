import { Link } from 'react-router-dom';

import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesInterview = () => {
  return (
    <TimelinesWrapper icon="entrance-left" line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          I had the privilege of interviewing an industry expert for an
          <Link to="/public-profile/profiles/blogger" className="text-sm link">
            &nbsp;upcoming blog post&nbsp;
          </Link>
        </div>
        <span className="text-xs text-gray-600">2 days ago, 4:07 PM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesInterview };
