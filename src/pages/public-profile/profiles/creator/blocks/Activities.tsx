import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils';

import {
  ActivitiesAnniversary,
  ActivitiesBloggingConference,
  ActivitiesFollowersMilestone,
  ActivitiesInterview,
  ActivitiesNewArticle,
  ActivitiesUpcomingContent
} from '@/partials/activities/items';

const Activities = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Activities</h3>

        <div className="flex items-center gap-2">
          <label className="switch">
            <span className="switch-label">
              Auto refresh:&nbsp;
              <span className="switch-on:hidden">Off</span>
              <span className="hidden switch-on:inline">On</span>
            </span>
            <input type="checkbox" value="1" name="check" defaultChecked readOnly />
          </label>
        </div>
      </div>

      <div className="card-body">
        <ActivitiesNewArticle />

        <ActivitiesInterview />

        <ActivitiesUpcomingContent />

        <ActivitiesBloggingConference
          image={
            <Fragment>
              <img
                src={toAbsoluteUrl(`/media/illustrations/3.svg`)}
                className="dark:hidden max-h-[160px]"
                alt=""
              />
              <img
                src={toAbsoluteUrl(`/media/illustrations/3-dark.svg`)}
                className="light:hidden max-h-[160px]"
                alt=""
              />
            </Fragment>
          }
        />

        <ActivitiesFollowersMilestone />

        <ActivitiesAnniversary />
      </div>

      <div className="card-footer justify-center">
        <Link to="/public-profile/activity" className="btn btn-link">
          All-time Activities
        </Link>
      </div>
    </div>
  );
};

export { Activities };
