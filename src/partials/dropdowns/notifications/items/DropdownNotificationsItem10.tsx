import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

const DropdownNotificationsItem10 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-25.png')}
          className="rounded-full size-8"
          alt="Leslie Alexander avatar"
        />
        <span className="size-1.5 badge badge-circle badge-success absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3.5 grow">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Samuel Lee
            </Link>
            <span className="text-gray-700">requested to add user to</span>
            <Link to="#" className="hover:text-primary-active text-primary font-semibold">
              TechSynergy
            </Link>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            22 hours ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Dev Team
          </span>
        </div>

        <div className="card shadow-none flex items-center flex-row justify-between gap-1.5 px-2.5 py-2 rounded-lg bg-light-active">
          <div className="flex flex-col">
            <Link to="#" className="hover:text-primary-active font-medium text-gray-900 text-xs">
              Ronald Richards
            </Link>
            <Link to="#" className="hover:text-primary-active text-gray-500 font-medium text-3xs">
              ronald.richards@gmail.com
            </Link>
          </div>

          <Link to="#" className="hover:text-primary-active text-gray-700 font-medium text-xs">
            Go to profile
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button className="btn btn-light btn-sm">Decline</button>
          <button className="btn btn-dark btn-sm">Accept</button>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem10 };
