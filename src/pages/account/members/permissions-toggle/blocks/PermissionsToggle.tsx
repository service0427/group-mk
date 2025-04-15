import { KeenIcon } from '@/components';

import { CommonHexagonBadge } from '@/partials/common';

interface IPermissionsToggleItem {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
}
interface IPermissionsToggleItems extends Array<IPermissionsToggleItem> {}

const PermissionsToggle = () => {
  const items: IPermissionsToggleItems = [
    {
      icon: 'category',
      title: 'Workspace Settings',
      description: 'Users may view and update the settings of the workspace.',
      checked: true
    },
    {
      icon: 'two-credit-cart',
      title: 'Billing Management',
      description: 'Users are authorized to review, update subscriptions.',
      checked: false
    },
    {
      icon: 'mouse-square',
      title: 'Integration Setup',
      description: 'Manage user integrations and associated tags.',
      checked: true
    },
    {
      icon: 'toggle-off-circle',
      title: 'Permissions Control',
      description: 'Grant or revoke user access and tags.',
      checked: false
    },
    {
      icon: 'map',
      title: 'Map Creation',
      description: 'Initiate new mapping projects within workspace.',
      checked: false
    },
    {
      icon: 'exit-up',
      title: 'Data Export',
      description: 'Allow extraction of workspace data for analysis.',
      checked: true
    },
    {
      icon: 'security-user',
      title: 'User Roles',
      description: 'Update roles and permissions for map users.',
      checked: true
    },
    {
      icon: 'shield-tick',
      title: 'Security Settings',
      description: 'Adjust workspace security protocols and measures.',
      checked: true
    },
    {
      icon: 'key-square',
      title: 'Insights Access',
      description: 'View workspace analytics and performance data.',
      checked: false
    },
    {
      icon: 'shop',
      title: 'Merchant List',
      description: 'Update and manage merchant associations.',
      checked: false
    }
  ];

  const renderItem = (item: IPermissionsToggleItem, index: number) => {
    return (
      <div key={index} className="rounded-xl border p-4 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3.5">
          <CommonHexagonBadge
            stroke="stroke-gray-300"
            fill="fill-gray-100"
            size="size-[45px]"
            badge={<KeenIcon icon={item.icon} className="text-lg text-gray-500" />}
          />

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 leading-none font-medium text-sm text-gray-900">
              {item.title}
            </span>
            <span className="text-2sm text-gray-700">{item.description}</span>
          </div>
        </div>

        <div className="switch switch-sm">
          <input
            defaultChecked={item.checked}
            name="param"
            type="checkbox"
            value={index}
            readOnly
          />
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Role Permissions for
          <a href="#" className="link">
            &nbsp;Project Manager
          </a>
        </h3>
      </div>
      <div className="card-body grid grid-cols-1 lg:grid-cols-2 gap-5 py-5 lg:py-7.5">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>
      <div className="card-footer justify-center">
        <a href="#" className="btn btn-sm btn-light btn-outline">
          New Permission
        </a>
      </div>
    </div>
  );
};

export { PermissionsToggle, type IPermissionsToggleItem, type IPermissionsToggleItems };
