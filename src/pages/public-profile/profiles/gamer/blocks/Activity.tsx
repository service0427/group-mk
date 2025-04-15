import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { toAbsoluteUrl } from '@/utils';

import {
  ActivitiesBloggingConference,
  ActivitiesLogin,
  ActivitiesNewProduct,
  ActivitiesProductSpecific,
  ActivitiesProductWebinar
} from '@/partials/activities/items';

const Activity = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>

        <div className="flex items-center gap-2">
          <label className="switch">
            <input
              className="order-2"
              type="checkbox"
              value="1"
              name="check"
              defaultChecked
              readOnly
            />
            <span className="switch-label order-1">
              Auto refresh:&nbsp;
              <span className="hidden switch-off:inline">Off</span>
              <span className="hidden switch-on:inline">On</span>
            </span>
          </label>
        </div>
      </div>

      <div className="card-body">
        <ActivitiesNewProduct />

        <ActivitiesProductWebinar />

        <ActivitiesLogin />

        <ActivitiesBloggingConference
          heading="Email campaign sent to Jenny for a special promotion."
          datetime="1 week ago, 11:45 AM"
          title="First Campaign Created"
          image={
            <Fragment>
              <img
                src={toAbsoluteUrl(`/media/illustrations/10.svg`)}
                className="dark:hidden max-h-[160px]"
                alt=""
              />
              <img
                src={toAbsoluteUrl(`/media/illustrations/10-dark.svg`)}
                className="light:hidden max-h-[160px]"
                alt=""
              />
            </Fragment>
          }
        />

        <ActivitiesProductSpecific />
      </div>

      <div className="card-footer justify-center">
        <Link to="/public-profile/activity" className="btn btn-link">
          All-time Activities
        </Link>
      </div>
    </div>
  );
};

export { Activity };
