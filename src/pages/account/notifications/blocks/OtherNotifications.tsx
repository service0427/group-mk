import { CardNotification } from '@/partials/cards';

import { IChannelsItem, IChannelsItems } from './Channels';

const OtherNotifications = () => {
  const items: IChannelsItems = [
    {
      icon: 'tab-tablet',
      title: 'Task Alert',
      description: 'Notification when a task is assigned to you.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      icon: 'dollar',
      title: 'Budget Warning',
      description: 'Get notified if nearing budget limit.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      icon: 'cheque',
      title: 'Invoice Alert',
      description: 'Alert for new and unpaid invoices.',
      actions: (
        <a href="#" className="btn btn-sm btn-light btn-outline text-center">
          View Invoices
        </a>
      )
    },
    {
      icon: 'message-text',
      title: 'Feedback Alert',
      description: 'When a client submits new feedback.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      icon: 'people',
      title: 'Collaboration Request',
      description: 'Invite to collaborate on a new document.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    },
    {
      icon: 'abstract-42',
      title: 'Meeting Reminder',
      description: 'Reminder of scheduled meetings for the day.',
      actions: (
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Show Meetings
        </a>
      )
    },
    {
      icon: 'tablet-ok',
      title: 'Status Change',
      description: 'Notifies changes in project or task status.',
      actions: (
        <div className="switch switch-sm">
          <input type="checkbox" name="param" defaultChecked value="1" readOnly />
        </div>
      )
    }
  ];

  const renderItem = (item: IChannelsItem, index: number) => {
    return (
      <CardNotification
        icon={item.icon}
        title={item.title}
        description={item.description}
        button={item.button}
        actions={item.actions}
        key={index}
      />
    );
  };

  return (
    <div className="card">
      <div className="card-header gap-2">
        <h3 className="card-title">Other Notifications</h3>

        <div className="flex items-center gap-2">
          <label className="switch">
            <input className="order-2" type="checkbox" value="1" name="check" readOnly />
            <span className="switch-label order-1">Team-Wide Alerts</span>
          </label>
        </div>
      </div>

      <div id="notifications_cards">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>
    </div>
  );
};

export { OtherNotifications };
