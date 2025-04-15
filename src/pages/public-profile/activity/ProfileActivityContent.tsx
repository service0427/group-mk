import { Fragment, useState } from 'react';

import { toAbsoluteUrl } from '@/utils';

import {
  ActivitiesAnniversary,
  ActivitiesBloggingConference,
  ActivitiesDesignerWelcome,
  ActivitiesFollowersMilestone,
  ActivitiesInterview,
  ActivitiesNewArticle,
  ActivitiesNewTeam,
  ActivitiesPhotographyWorkshop,
  ActivitiesProductWebinar,
  ActivitiesProjectStatus,
  ActivitiesUpcomingContent,
  ActivitiesVirtualTeam
} from '@/partials/activities/items';

const ProfileActivityContent = () => {
  const [currentYear, setCurrentYear] = useState(2024);
  const years = Array.from({ length: 8 }, (_, i) => 2024 - i);

  return (
    <div className="flex gap-5 lg:gap-7.5">
      {years.map((year, index) => (
        <div
          key={index}
          className={`card grow ${year === currentYear ? '' : 'hidden'}`}
          id={`activity_${year}`}
        >
          <div className="card-header">
            <h3 className="card-title">Activity</h3>
            <div className="flex items-center gap-2">
              <label className="switch">
                <input className="order-2" type="checkbox" value="1" name="check" defaultChecked />
                <span className="switch-label">
                  Auto refresh:&nbsp;
                  <span className="switch-on:hidden">Off</span>
                  <span className="hidden switch-on:inline">On</span>
                </span>
              </label>
            </div>
          </div>
          <div className="card-body">
            {(year === 2024 || year === 2023 || year === 2022) && <ActivitiesNewArticle />}
            {(year === 2024 || year === 2022) && <ActivitiesInterview />}
            {(year === 2024 || year === 2021) && <ActivitiesPhotographyWorkshop />}
            <ActivitiesUpcomingContent />
            {(year === 2024 || year === 2019) && <ActivitiesProductWebinar />}
            <ActivitiesFollowersMilestone />
            {(year === 2024 || year === 2021) && <ActivitiesProjectStatus />}
            {(year === 2024 || year === 2018) && (
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
            )}
            <ActivitiesDesignerWelcome />
            {(year === 2024 || year === 2017) && <ActivitiesNewTeam />}
            <ActivitiesVirtualTeam />
            <ActivitiesAnniversary />
          </div>
          <div className="card-footer justify-center">
            <a href="#" className="btn btn-link">
              All-time Activity
            </a>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2.5" data-tabs="true">
        {years.map((year, index) => (
          <a
            key={index}
            href="#"
            data-tab-toggle={`#activity_${year}`}
            className={`btn btn-sm text-gray-600 hover:text-primary tab-active:bg-primary-light tab-active:text-primary ${
              year === currentYear ? 'active' : ''
            }`}
            onClick={() => {
              setCurrentYear(year);
            }}
          >
            {year}
          </a>
        ))}
      </div>
    </div>
  );
};

export { ProfileActivityContent };
