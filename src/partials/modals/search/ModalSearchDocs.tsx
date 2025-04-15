import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import React from 'react';
import { IModalSearchDocsItem } from './types';

// Define the interface for the items
interface IModalSearchDocsProps {
  items: IModalSearchDocsItem[];
}

const ModalSearchDocs = ({ items }: IModalSearchDocsProps) => {
  // Example items moved inside the component
  return (
    <div className="menu menu-default p-0 flex-col">
      <div className="grid">
        {items.map((item, index) => (
          <div className="menu-item" key={index}>
            <div className="menu-link flex items-center">
              <div className="flex items-center grow gap-2.5">
                <img src={toAbsoluteUrl(`/media/file-types/${item.image}`)} alt={item.desc} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-primary mb-px">
                    {item.desc}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{item.date}</span>
                </div>
              </div>
              <button className="btn btn-icon btn-light btn-clear btn-sm">
                <KeenIcon icon="dots-vertical" />
              </button>
            </div>
          </div>
        ))}

        <div className="menu-item px-4 pt-2.5">
          <a href="#" className="btn btn-sm btn-light justify-center">
            Go to Users
          </a>
        </div>
      </div>
    </div>
  );
};

export { ModalSearchDocs };
