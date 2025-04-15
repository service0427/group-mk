import { KeenIcon } from '@/components';

import { CommonHexagonBadge } from '@/partials/common';
import { ReactNode } from 'react';

interface IQuickSettingsItem {
  icon: string;
  title: string;
  description: string;
  actions: ReactNode;
}
interface IQuickSettingsItems extends Array<IQuickSettingsItem> {}

const QuickSettings = () => {
  const items: IQuickSettingsItems = [
    {
      icon: 'shield-tick',
      title: 'Enforce two-step verification',
      description: 'Add an extra layer of security with two-step verification.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" checked name="param" value="1" readOnly />
        </div>
      )
    },
    {
      icon: 'exit-right',
      title: 'Logout everyone',
      description: 'Instantly sign out all users from all devices.',
      actions: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Logout everyone
        </a>
      )
    }
  ];

  const renderItem = (item: IQuickSettingsItem, index: number) => {
    return (
      <div key={index} className="card-group flex items-center justify-between py-4 gap-2.5">
        <div className="flex items-center gap-3.5">
          <CommonHexagonBadge
            stroke="stroke-gray-300"
            fill="fill-gray-100"
            size="size-[50px]"
            badge={<KeenIcon icon={item.icon} className="text-1.5xl text-gray-500" />}
          />

          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 leading-none font-medium text-sm text-gray-900">
              {item.title}
            </span>
            <span className="text-2sm text-gray-700">{item.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">{item.actions}</div>
      </div>
    );
  };

  return (
    <div className="card">
      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </div>
  );
};

export { QuickSettings, type IQuickSettingsItem, type IQuickSettingsItems };
