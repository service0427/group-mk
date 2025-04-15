import { Link } from 'react-router-dom';

import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesNewArticle = () => {
  return (
    <TimelinesWrapper icon="people" line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          Posted a new article
          <Link to="/public-profile/profiles/blogger" className="text-sm font-medium link">
            &nbsp;Top 10 Tech Trends&nbsp;
          </Link>
        </div>
        <span className="text-xs text-gray-600">Today, 9:00 AM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesNewArticle };
