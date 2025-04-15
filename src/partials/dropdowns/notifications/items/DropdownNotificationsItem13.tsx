import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { CommonAvatars } from '@/partials/common';

const DropdownNotificationsItem13 = () => {
  return (
    <div className="flex grow gap-2 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-29.png')}
          className="rounded-full size-8"
          alt="Ava Peterson"
        />
        <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3 grow">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Ethan Parker
            </Link>
            <span className="text-gray-700">created a new tasks to</span>
            <Link to="#" className="hover:text-primary-active text-primary">
              Site Sculpt
            </Link>
            <span className="text-gray-700">project</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            3 days ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Web Designer
          </span>
        </div>

        <div className="card shadow-none p-3.5 gap-3.5 rounded-lg bg-light-active">
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-900 text-xs">
                Location history is erased after Logging In
              </span>
              <span className="font-medium text-gray-500 text-3xs">Due Date: 15 May, 2024</span>
            </div>

            <CommonAvatars
              size="size-6"
              group={[{ path: '/media/avatars/300-3.png' }, { path: '/media/avatars/300-2.png' }]}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="badge badge-sm badge-success badge-outline">Improvement</span>
            <span className="badge badge-sm badge-danger badge-outline">Bug</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem13 };
