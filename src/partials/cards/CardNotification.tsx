import { KeenIcon } from '@/components';

import { CommonHexagonBadge } from '../common';
import { ReactNode } from 'react';

interface INotificationProps {
  icon: string;
  title: string;
  description: string;
  button?: boolean;
  actions: ReactNode;
}

const CardNotification = ({ icon, title, description, button, actions }: INotificationProps) => {
  return (
    <div className="card-group flex items-center justify-between py-4 gap-2.5">
      <div className="flex items-center gap-3.5">
        <CommonHexagonBadge
          size="size-[50px]"
          badge={<KeenIcon icon={icon} className="text-1.5xl text-gray-500" />}
          stroke="stroke-gray-300"
          fill="fill-gray-100"
        />

        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 leading-none font-medium text-sm text-gray-900">
            {title}
          </span>
          <span className="text-2sm text-gray-700">{description}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {button && (
          <a href="#" className="btn btn-xs btn-icon btn-primary btn-clear">
            <KeenIcon icon="notepad-edit" />
          </a>
        )}

        <div className="flex items-center gap-2.5">{actions}</div>
      </div>
    </div>
  );
};

export { CardNotification, type INotificationProps };
