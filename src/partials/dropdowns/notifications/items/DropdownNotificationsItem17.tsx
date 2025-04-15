import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';

const DropdownNotificationsItem17 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-9.png')}
          className="rounded-full size-8"
          alt="Aaron Foster avatar"
        />
        <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-2.5 grow">
        <div className="flex flex-col gap-1 mb-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Gabriel Bennett
            </Link>
            <span className="text-gray-700">started connect you</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            3 day ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Development
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button className="btn btn-sm btn-light">
            <KeenIcon icon="check-circle" />
            Connected
          </button>
          <button className="btn btn-dark btn-sm">Go to profile</button>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem17 };
