import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

const DropdownNotificationsItem4 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-1.png')}
          className="rounded-full size-8"
          alt="Jane Perez"
        />
        <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Jane Perez
            </Link>
            <span className="text-gray-700">invites you to review a file.</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            3 hours ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            742kb
          </span>
        </div>

        <div className="card shadow-none flex items-center flex-row gap-1.5 p-2.5 rounded-lg bg-light-active">
          <img src={toAbsoluteUrl('/media/file-types/pdf.svg')} className="h-5" alt="" />
          <Link to="#" className="hover:text-primary-active font-medium text-gray-700 text-xs me-1">
            Launch_nov24.pptx
          </Link>
          <span className="font-medium text-gray-500 text-2xs">Edited 39 mins ago</span>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem4 };
