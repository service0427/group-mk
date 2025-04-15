import { toAbsoluteUrl } from '@/utils';

interface IDropdownChatMessageInProps {
  text: string;
  time: string;
  avatar: string;
}

const DropdownChatMessageIn = ({ text, time, avatar }: IDropdownChatMessageInProps) => {
  return (
    <div className="flex items-end gap-3.5 px-5">
      <img src={toAbsoluteUrl(avatar)} className="rounded-full size-9" alt="" />

      <div className="flex flex-col gap-1.5">
        <div
          className="card shadow-none flex flex-col bg-gray-100 gap-2.5 p-3 rounded-bl-none text-2sm font-medium text-gray-700"
          dangerouslySetInnerHTML={{ __html: text }}
        />
        <span className="text-2xs font-medium text-gray-500">{time}</span>
      </div>
    </div>
  );
};

export { DropdownChatMessageIn, type IDropdownChatMessageInProps };
