import React from 'react';
import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';
import { IModalSearchUsersItem } from './types';

interface IModalSearchUsersProps {
  items: IModalSearchUsersItem[];
  more?: boolean;
}

const ModalSearchUsers = ({ items, more = true }: IModalSearchUsersProps) => {
  return (
    <div className="menu menu-default p-0 flex-col">
      <div className="grid gap-1">
        {items.map((item, index) => (
          <div className="menu-item" key={index}>
            <div className="menu-link flex justify-between gap-2">
              {/* User avatar and info */}
              <div className="flex items-center gap-2.5">
                <img
                  src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
                  className="rounded-full size-9 shrink-0"
                  alt={item.name}
                />
                <div className="flex flex-col">
                  <a
                    href="#"
                    className="text-sm font-semibold text-gray-900 hover:text-primary-active mb-px"
                  >
                    {item.name}
                  </a>
                  <span className="text-2sm font-normal text-gray-500">
                    {item.email} connections
                  </span>
                </div>
              </div>

              {/* Status badge and action button */}
              <div className="flex items-center gap-2.5">
                <div className={`badge badge-pill badge-outline ${item.color} gap-1.5`}>
                  <span className={`badge badge-dot ${item.color} size-1.5`}></span>
                  {item.label}
                </div>
                <button className="btn btn-icon btn-light btn-clear btn-sm">
                  <KeenIcon icon="dots-vertical" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Conditional "Go to Users" button */}
        {!more && (
          <div className="menu-item px-4 pt-2">
            <a href="#" className="btn btn-sm btn-light justify-center">
              Go to Users
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export { ModalSearchUsers };
