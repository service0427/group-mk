import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { ChangeEvent, useState } from 'react';

interface IDropdownNotificationsItemProps {
  userName: string;
  avatar: string;
  description: string;
  link: string;
  label: string;
  time: string;
  specialist: string;
  text: string;
}

const DropdownNotificationsItem1 = ({
  userName,
  avatar,
  description,
  link,
  label,
  time,
  specialist,
  text
}: IDropdownNotificationsItemProps) => {
  const [emailInput, setEmailInput] = useState('');
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl(`/media/avatars/${avatar}`)}
          className="rounded-full size-8"
          alt={`${userName} avatar`}
        />
        <span className="size-1.5 badge badge-circle badge-success absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2"></span>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <div className="text-2sm font-medium">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold">
              {userName}
            </Link>
            <span className="text-gray-700"> {description} </span>
            <Link to="#" className="hover:text-primary-active text-primary">
              {link}
            </Link>
            <span className="text-gray-700"> {label} </span>
          </div>
          <span className="flex items-center text-2xs font-medium text-gray-500">
            {time}
            <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
            {specialist}
          </span>
        </div>

        <div className="card shadow-none flex flex-col gap-2.5 p-3.5 rounded-lg bg-light-active">
          <div className="text-2sm font-semibold text-gray-600 mb-px">
            <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold">
              @Cody
            </Link>
            <span className="text-gray-700 font-medium"> {text} </span>
          </div>

          <label className="input input-sm">
            <input
              type="text"
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Reply"
              value={emailInput}
            />
            <button className="btn btn-icon">
              <KeenIcon icon="picture" />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem1 };
