import React from 'react';
import { toAbsoluteUrl } from '@/utils';
import { CommonAvatars } from '@/partials/common';
import { IModalSearchIntegrationsItem } from './types';

// Define the props interface
interface IModalSearchIntegrationsProps {
  items: IModalSearchIntegrationsItem[];
}

const ModalSearchIntegrations = ({ items }: IModalSearchIntegrationsProps) => {
  return (
    <div className="menu menu-default p-0 flex-col">
      {items.map((item, index) => (
        <div className="menu-item" key={index}>
          <div className="menu-link flex items-center justify-between gap-2">
            <div className="flex items-center grow gap-2">
              {/* Logo */}
              <div className="flex items-center justify-center size-10 shrink-0 rounded-full border border-gray-200 bg-gray-100">
                <img
                  src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                  className="size-6 shrink-0"
                  alt={item.name}
                />
              </div>

              {/* Name and description */}
              <div className="flex flex-col gap-0.5">
                <a
                  href="#"
                  className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                >
                  {item.name}
                </a>
                <span className="text-2xs font-medium text-gray-600">{item.description}</span>
              </div>
            </div>

            {/* Team avatars */}
            <div className="flex justify-end shrink-0">
              <CommonAvatars size="size-[30px]" group={item.team} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { ModalSearchIntegrations };
