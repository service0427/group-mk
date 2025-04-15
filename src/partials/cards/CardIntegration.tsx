import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { ReactNode } from 'react';

interface IIntegrationProps {
  logo: string;
  path: string;
  name: string;
  description: string;
  actions: ReactNode;
}

const CardIntegration = ({ logo, path, name, description, actions }: IIntegrationProps) => {
  return (
    <div className="card">
      <div className="card-body p-5 lg:p-7.5">
        <div className="flex items-center justify-between mb-3 lg:mb-5">
          <div className="flex items-center justify-center">
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
              className="h-11 shrink-0"
              alt=""
            />
          </div>
          <div className="btn btn-sm btn-icon btn-clear btn-light">
            <KeenIcon icon="exit-right-corner" />
          </div>
        </div>

        <div className="flex flex-col gap-1 lg:gap-2.5">
          <Link
            to={`${path}`}
            className="text-base font-medium text-gray-900 hover:text-primary-active"
          >
            {name}
          </Link>
          <span className="text-2sm text-gray-700">{description}</span>
        </div>
      </div>

      <div className="card-footer justify-between items-center py-3.5">
        <a className="btn btn-light btn-sm">
          <KeenIcon icon="mouse-square" />
          Connect
        </a>
        <div className="flex items-center gap-2.5">{actions}</div>
      </div>
    </div>
  );
};

export { CardIntegration, type IIntegrationProps };
