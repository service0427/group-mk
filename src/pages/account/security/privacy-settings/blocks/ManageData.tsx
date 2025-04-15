import { ReactNode } from 'react';

interface IManageDataItem {
  title: string;
  description: string;
  control: ReactNode;
}
interface IManageDataItems extends Array<IManageDataItem> {}

const ManageData = () => {
  const items: IManageDataItems = [
    {
      title: 'Ony invited People',
      description: 'Invite selected people via email.',
      control: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Start
        </a>
      )
    },
    {
      title: 'People with the link',
      description: 'Create a pubic link for your report.',
      control: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Delete
        </a>
      )
    },
    {
      title: 'No one',
      description: 'Reports will be visible only for you.',
      control: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" value="1" readOnly />
        </div>
      )
    }
  ];

  const renderItem = (item: IManageDataItem, index: number) => {
    return (
      <div key={index} className="card-group flex items-center justify-between py-4 gap-2.5">
        <div className="flex flex-col justify-center gap-1.5">
          <span className="leading-none font-medium text-sm text-gray-900">{item.title}</span>
          <span className="text-2sm text-gray-700">{item.description}</span>
        </div>

        {item.control}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Manage your Data</h3>
      </div>
      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </div>
  );
};

export { ManageData, type IManageDataItem, type IManageDataItems };
