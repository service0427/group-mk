import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

const DropdownNotificationsItem2 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-5.png')}
          className="rounded-full size-8"
          alt="Leslie Alexander avatar"
        />
        <span className="size-1.5 badge badge-circle badge-success absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold">
              Leslie Alexander
            </Link>
            <span className="text-gray-700"> added new tags to </span>
            <Link to="#" className="hover:text-primary-active text-primary">
              Web Redesign 2024
            </Link>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            53 mins ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            ACME
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <span className="badge badge-sm badge-info badge-outline">Client-Request</span>
          <span className="badge badge-sm badge-warning badge-outline">Figma</span>
          <span className="badge badge-sm badge-light badge-outline">Redesign</span>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem2 };
