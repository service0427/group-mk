import React from 'react';
import { IModalSearchSettingsGroup } from './types';
import { Link } from 'react-router-dom';
import { ModalSearchSettingsItems } from './ModalSearchSettingsItems';

export interface IModalSearchSettingsProps {
  items: IModalSearchSettingsGroup[];
  more?: boolean;
}

const ModalSearchSettings = ({ items }: IModalSearchSettingsProps) => {
  return (
    <div className="menu menu-default p-0 flex-col">
      {items.map((group, groupIndex) => (
        <div key={groupIndex} className="pb-2.5">
          {/* Group title */}
          <div className="text-xs text-gray-600 font-medium pt-2.5 ps-5">{group.title}</div>

          <ModalSearchSettingsItems items={group.children} />
        </div>
      ))}

      <div className="menu-item px-4 pt-2.5">
        <Link to="#" className="btn btn-sm btn-light justify-center">
          Go to Users
        </Link>
      </div>
    </div>
  );
};

export { ModalSearchSettings };
