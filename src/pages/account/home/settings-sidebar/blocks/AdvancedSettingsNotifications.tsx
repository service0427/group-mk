import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

import { CommonHexagonBadge } from '@/partials/common';
import { ReactNode } from 'react';

interface IAdvancedSettingsNotificationsItem {
  title: string;
  description: string;
  badge: ReactNode;
}
interface IAdvancedSettingsNotificationsItems extends Array<IAdvancedSettingsNotificationsItem> {}

const AdvancedSettingsNotifications = () => {
  const items: IAdvancedSettingsNotificationsItems = [
    {
      title: 'Email',
      description: 'Tailor Your Email Preferences.',
      badge: <KeenIcon icon="sms" className="text-xl text-gray-500" />
    },
    {
      title: 'Slack',
      description: 'Stay Updated on Slack.',
      badge: <img src={toAbsoluteUrl('/media/brand-logos/slack.svg')} className="h-5" alt="" />
    }
  ];

  const renderItem = (item: IAdvancedSettingsNotificationsItem, index: number) => {
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center flex-wrap gap-3.5">
          <CommonHexagonBadge
            stroke="stroke-gray-300"
            fill="fill-gray-100"
            size="size-[50px]"
            badge={item.badge}
          />

          <div className="flex flex-col">
            <a
              href="#"
              className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
            >
              {item.title}
            </a>
            <span className="text-2sm text-gray-700">{item.description}</span>
          </div>
        </div>

        <label className="switch switch-sm">
          <input type="checkbox" defaultChecked value="1" readOnly />
        </label>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header" id="advanced_settings_notifications">
        <h3 className="card-title">Notifications</h3>
      </div>
      <div className="card-body lg:py-7.5">
        <div className="flex flex-wrap items-center gap-5 mb-5 lg:mb-7">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="flex flex-col gap-3.5 mb-7">
          <span className="text-md font-medium text-gray-900 pb-0.5">Desktop notifications</span>

          <div className="flex flex-col items-start gap-4">
            <label className="radio-group">
              <input
                className="radio"
                name="desktop_notification"
                type="radio"
                value="1"
                readOnly
              />
              <span className="radio-label radio-label-sm">All new messages (Recommended)</span>
            </label>
            <label className="radio-group">
              <input
                className="radio"
                name="desktop_notification"
                type="radio"
                value="2"
                readOnly
              />
              <span className="radio-label radio-label-sm">Direct @mentions</span>
            </label>
            <label className="radio-group">
              <input
                className="radio"
                name="desktop_notification"
                type="radio"
                value="3"
                readOnly
              />
              <span className="radio-label radio-label-sm">Disabled</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 mb-7">
          <span className="text-md font-medium text-gray-900 pb-0.5">Email notifications</span>

          <div className="flex flex-col items-start gap-4">
            <label className="radio-group">
              <input className="radio" name="email_notification" type="radio" value="1" readOnly />
              <span className="radio-label radio-label-sm">All new messages and statuses</span>
            </label>
            <label className="radio-group">
              <input className="radio" name="email_notification" type="radio" value="2" readOnly />
              <span className="radio-label radio-label-sm text-gray-800 font-medium">
                AUnread messages and statuses
              </span>
            </label>
            <label className="radio-group">
              <input className="radio" name="email_notification" type="radio" value="3" readOnly />
              <span className="radio-label radio-label-sm">Disabled</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <span className="text-md font-medium text-gray-900 pb-0.5">Subscriptions</span>

          <label className="checkbox-group">
            <input className="checkbox" name="check" type="checkbox" value="1" readOnly />
            <span className="checkbox-label checkbox-label-sm">
              Automatically subscribe to tasks you create
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export {
  AdvancedSettingsNotifications,
  type IAdvancedSettingsNotificationsItem,
  type IAdvancedSettingsNotificationsItems
};
