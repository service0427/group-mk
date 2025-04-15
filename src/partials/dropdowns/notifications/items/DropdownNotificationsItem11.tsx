import { KeenIcon } from '@/components';

const DropdownNotificationsItem11 = () => {
  return (
    <div className="flex items-center grow gap-2.5 px-5">
      <div className="flex items-center justify-center size-8 bg-success-light rounded-full border border-success-clarity">
        <KeenIcon icon="check" className="text-lg text-success" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-2sm font-medium text-gray-700">
          You have succesfully verified your account
        </span>
        <span className="font-medium text-gray-500 text-2xs">2 days ago</span>
      </div>
    </div>
  );
};

export { DropdownNotificationsItem11 };
