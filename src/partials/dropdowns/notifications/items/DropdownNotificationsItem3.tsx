import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';

interface IDropdownNotificationsItemProps {
  userName: string;
  avatar: string;
  badgeColor: string;
  description: string;
  link: string;
  day: string;
  date: string;
  info: string;
}

const DropdownNotificationsItem3 = ({
  userName,
  avatar,
  badgeColor,
  description,
  link,
  day,
  date,
  info
}: IDropdownNotificationsItemProps) => {
  return (
    <div className="flex grow gap-2.5 px-5">
      <div className="relative shrink-0 mt-0.5">
        <img
          src={toAbsoluteUrl(`/media/avatars/${avatar}`)}
          className="rounded-full size-8"
          alt={`${userName} avatar`}
        />
        <span
          className={`size-1.5 badge badge-circle ${badgeColor} absolute top-7 end-0.5 ring-1 ring-light transform -translate-y-1/2`}
        ></span>
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <div className="text-2sm font-medium mb-px">
              <Link to="#" className="hover:text-primary-active text-gray-900 font-semibold">
                {userName}
              </Link>
              <span className="text-gray-700"> {description} </span>
              <Link to="#" className="hover:text-primary-active text-primary">
                {link}
              </Link>
              <span className="text-gray-700"> {day} </span>
            </div>
            <span className="flex items-center text-2xs font-medium text-gray-500">
              {' '}
              {date}
              <span className="badge badge-circle bg-gray-500 size-1 mx-1.5"></span>
              {info}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button className="btn btn-light btn-sm">Decline</button>
            <button className="btn btn-dark btn-sm">Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem3 };
