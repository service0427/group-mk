import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';

import { CommonAvatars } from '@/partials/common';

const TeamMeeting = () => {
  return (
    <div className="card h-full">
      <div className="card-body lg:p-7.5 lg:pt-6 p-5">
        <div className="flex items-center justify-between flex-wrap gap-5 mb-7.5">
          <div className="flex flex-col gap-1">
            <span className="text-1.5xl font-semibold text-gray-900">Team Meeting</span>
            <span className="text-sm font-semibold text-gray-800">09:00 - 09:30</span>
          </div>

          <img src={toAbsoluteUrl('/media/brand-logos/zoom.svg')} className="size-7" alt="" />
        </div>

        <p className="text-sm font-normal text-gray-800 leading-5.5 mb-8">
          Team meeting to discuss strategies, outline <br />
          project milestones, define key goals, and <br />
          establish clear timelines.
        </p>

        <div className="flex rounded-lg bg-gray-100 gap-10 p-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1.5 text-sm font-normal text-gray-800">
              <KeenIcon icon="geolocation" className="text-base text-gray-500" />
              Location
            </div>
            <div className="text-sm font-medium text-gray-800 pt-1.5">Amsterdam</div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-1.5 text-sm font-normal text-gray-800">
              <KeenIcon icon="users" className="text-base text-gray-500" />
              Team
            </div>

            <CommonAvatars
              size="size-[30px]"
              group={[
                { filename: '300-4.png' },
                { filename: '300-1.png' },
                { filename: '300-2.png' },
                {
                  fallback: '+10',
                  variant: 'text-success-inverse text-4xs ring-success-light bg-success'
                }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="card-footer justify-center">
        <a href="#" className="btn btn-link">
          Join Meeting
        </a>
      </div>
    </div>
  );
};

export { TeamMeeting };
