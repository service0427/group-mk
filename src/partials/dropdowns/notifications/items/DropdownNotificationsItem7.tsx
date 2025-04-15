import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { CommonAvatars } from '@/partials/common';

const DropdownNotificationsItem7 = () => {
  return (
    <div className="flex grow gap-2 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-15.png')}
          className="rounded-full size-8"
          alt="Nova Hawthorne avatar"
        />
        <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3 grow" id="notification_request_7">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Nova Hawthorne
            </Link>
            <span className="text-gray-700">sent you an meeting invation</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            2 days ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Dev Team
          </span>
        </div>

        <div className="card shadow-none p-2.5 rounded-lg bg-light-active">
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="border border-brand-clarity rounded-lg">
                <div className="flex items-center justify-center border-b border-b-brand-clarity bg-brand-light rounded-t-lg">
                  <span className="text-3xs text-brand fw-medium p-1.5">Apr</span>
                </div>
                <div className="flex items-center justify-center size-9">
                  <span className="fw-semibold text-gray-900 text-md tracking-tight">12</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Link
                  to="#"
                  className="hover:text-primary-active text-gray-700 font-medium text-xs me-1"
                >
                  Peparation For Release
                </Link>
                <span className="font-medium text-gray-600 text-2xs">9:00 PM - 10:00 PM</span>
              </div>
            </div>

            <CommonAvatars
              size="size-6"
              group={[
                { path: '/media/avatars/300-4.png' },
                { path: '/media/avatars/300-1.png' },
                { path: '/media/avatars/300-2.png' },
                {
                  fallback: '+3',
                  variant: 'text-success-inverse size-6 ring-success-light bg-success'
                }
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button className="btn btn-light btn-sm">Decline</button>
          <button className="btn btn-dark btn-sm">Accept</button>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem7 };
