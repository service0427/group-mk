import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

const DropdownNotificationsItem15 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-19.png')}
          className="rounded-full size-8"
          alt="Natalie Wood avatar"
        />
        <span className="size-1.5 badge badge-circle badge-success absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-2.5 grow" id="notification_request_15">
        <div className="flex flex-col gap-1 mb-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Natalie Wood
            </Link>
            <span className="text-gray-700">wants to edit marketing project</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            1 day ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Designer
          </span>
        </div>

        <div className="card shadow-none flex items-center flex-row gap-1.5 p-2.5 rounded-lg bg-light-active">
          <div className="flex items-center justify-center w-[26px] h-[30px] shrink-0 bg-white rounded border border-gray-200">
            <img
              src={toAbsoluteUrl('/media/brand-logos/jira.svg')}
              className="rounded-full size-8"
              alt=""
            />
          </div>

          <Link to="#" className="hover:text-primary-active font-medium text-gray-700 text-xs me-1">
            User-feedback.jira
          </Link>
          <span className="font-medium text-gray-500 text-2xs">Edited 1 hour ago</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button className="btn btn-light btn-sm">Decline</button>
          <button className="btn btn-dark btn-sm">Accept</button>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem15 };
