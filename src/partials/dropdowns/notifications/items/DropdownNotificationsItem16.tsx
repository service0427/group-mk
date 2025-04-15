import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';

const DropdownNotificationsItem16 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-17.png')}
          className="rounded-full size-8"
          alt="Aaron Foster avatar"
        />
        <span className="size-1.5 badge badge-circle badge-success absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-2.5 grow" id="notification_request_16">
        <div className="flex flex-col gap-1 mb-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Aaron Foster
            </Link>
            <span className="text-gray-700">requested to vie</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            3 day ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Larsen Ltd
          </span>
        </div>

        <div className="card shadow-none flex items-center flex-row gap-1.5 px-2.5 py-1.5 rounded-lg bg-light-active">
          <KeenIcon icon="user-tick" className="text-base text-success" />
          <span className="font-medium text-success text-2sm">You allowed Aaron to view</span>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem16 };
