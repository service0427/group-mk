import { Fragment, ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface IBackupSettingsItem {
  title: string;
  description: string;
  control: ReactNode;
}
interface IBackupSettingsItems extends Array<IBackupSettingsItem> {}

const BackupSettings = () => {
  const items: IBackupSettingsItems = [
    {
      title: 'Automatic Backup',
      description: 'Scheduled Data Protection',
      control: (
        <Fragment>
          <label className="switch switch-sm">
            <input
              defaultChecked
              name="check"
              type="checkbox"
              value="1"
              className="order-2"
              readOnly
            />
          </label>
        </Fragment>
      )
    },
    {
      title: 'Backup Frequency',
      description: 'Select Preferred Backup',
      control: (
        <Fragment>
          <Select defaultValue="1">
            <SelectTrigger className="w-24" size="sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="w-24">
              <SelectItem value="1">Daily</SelectItem>
              <SelectItem value="2">Weekly</SelectItem>
              <SelectItem value="3">Monthly</SelectItem> 
              <SelectItem value="4">Yearly</SelectItem> 
            </SelectContent>
          </Select>  
        </Fragment>
      )
    },
    {
      title: 'Manual Backup',
      description: 'Backup When Needed',
      control: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Start
        </a>
      )
    }
  ];

  const renderItem = (item: IBackupSettingsItem, index: number) => {
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
      <div className="card-header mb-1">
        <h3 className="card-title">Backup Settings</h3>
      </div>
      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </div>
  );
};

export { BackupSettings, type IBackupSettingsItem, type IBackupSettingsItems };
