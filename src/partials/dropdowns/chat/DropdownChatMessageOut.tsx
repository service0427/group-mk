import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';
import clsx from 'clsx';

interface IDropdownChatMessageOutProps {
  text: string;
  time: string;
  read: boolean;
}

const DropdownChatMessageOut = ({ text, time, read }: IDropdownChatMessageOutProps) => {
  return (
    <div className="flex items-end justify-end gap-3.5 px-5">
      <div className="flex flex-col gap-1.5">
        <div
          className="card shadow-none flex bg-primary text-primary-inverse text-2sm font-medium flex-col gap-2.5 p-3 rounded-be-none"
          dangerouslySetInnerHTML={{ __html: text }}
        />

        <div className="flex items-center justify-end relative">
          <span className="text-2xs font-medium text-gray-600 me-6">{time}</span>
          <KeenIcon
            icon="double-check"
            className={clsx('text-lg absolute', read ? 'text-success' : 'text-gray-400')}
          />
        </div>
      </div>

      <div className="relative shrink-0">
        <img
          src={toAbsoluteUrl('/media/avatars/300-2.png')}
          className="rounded-full size-9"
          alt=""
        />
        <span className="size-[4.8px] badge badge-circle badge-success absolute top-7 end-0 transform -translate-y-1/2"></span>
      </div>
    </div>
  );
};

export { DropdownChatMessageOut, type IDropdownChatMessageOutProps };
