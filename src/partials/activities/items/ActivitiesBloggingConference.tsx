import { Link } from 'react-router-dom';

import { TimelinesWrapper } from '@/partials/timelines/default/item';
import { ReactNode } from 'react';

interface IBloggingConferenceProps {
  heading?: string;
  datetime?: string;
  image?: ReactNode;
  title?: string;
}

const ActivitiesBloggingConference = ({
  heading,
  datetime,
  image,
  title
}: IBloggingConferenceProps) => {
  return (
    <TimelinesWrapper icon="directbox-default" line={true}>
      <div className="flex flex-col pb-2.5">
        <span className="text-sm text-gray-800">
          {heading ?? 'Attending the virtual blogging conference was an enriching experience'}
        </span>

        <span className="text-xs text-gray-600">{datetime ?? '2 days ago, 4:07 PM'}</span>
      </div>

      <div className="card shadow-none">
        <div className="card-body lg:py-4">
          <div className="flex justify-center py-4">{image}</div>

          <div className="flex flex-col gap-1">
            <div className="text-md font-medium text-gray-900 text-center">
              {title ?? 'Blogging Conference'}
            </div>

            <div className="flex items-center justify-center gap-1">
              <Link to="/public-profile/profiles/company" className="text-2sm font-semibold link">
                Axio new release
              </Link>
              <span className="text-2sm text-gray-700 me-2">email campaign</span>
              <span className="badge badge-sm badge-success badge-outline">Public</span>
            </div>
          </div>
        </div>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesBloggingConference, type IBloggingConferenceProps };
