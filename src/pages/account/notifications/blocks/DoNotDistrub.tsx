import { KeenIcon } from '@/components';
import { ReactNode } from 'react';

interface IDoNotDistrubProps {
  title?: string;
  icon?: ReactNode;
  text?: string;
}

const DoNotDistrub = ({ title, icon, text }: IDoNotDistrubProps) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title || 'Do Not Disturb'}</h3>
      </div>
      <div className="card-body flex flex-col gap-2.5">
        <p className="text-2sm text-gray-700">
          Activate 'Do Not Disturb' to silence all notifications and focus without interruptions
          during specified hours or tasks.
        </p>
        <div>
          <a href="#" className="btn btn-link flex-none">
            Learn more
          </a>
        </div>
      </div>
      <div className="card-footer justify-center">
        <a className="btn btn-light btn-sm">
          {icon || <KeenIcon icon="notification-bing" />}
          {text || 'Pause Notifications'}
        </a>
      </div>
    </div>
  );
};

export { DoNotDistrub, type IDoNotDistrubProps };
