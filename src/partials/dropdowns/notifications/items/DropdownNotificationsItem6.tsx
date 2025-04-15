import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

const DropdownNotificationsItem6 = () => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl('/media/avatars/300-14.png')}
          className="rounded-full size-8"
          alt="Tyler Hero"
        />
        <span className="size-1.5 badge badge-circle bg-gray-400 absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold me-1">
              Tyler Hero
            </Link>
            <span className="text-gray-700">wants to view your design project</span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            3 hours ago
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            Metronic Launcher mockups
          </span>
        </div>

        <div className="card shadow-none flex items-center flex-row gap-1.5 p-2.5 rounded-lg bg-light-active">
          <div className="flex items-center justify-center w-[26px] h-[30px] shrink-0 bg-light rounded border border-gray-200">
            <img src={toAbsoluteUrl('/media/file-types/figma.svg')} className="h-5" alt="" />
          </div>

          <Link to="#" className="hover:text-primary-active font-medium text-gray-700 text-xs me-1">
            Launch_nov24.pptx
          </Link>
          <span className="font-medium text-gray-500 text-2xs">Edited 2 mins ago</span>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem6 };
