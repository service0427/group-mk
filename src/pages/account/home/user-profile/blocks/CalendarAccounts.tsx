import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface ICalendarAccountsItem {
  logo: string;
  title: string;
  email: string;
}
interface ICalendarAccountsItems extends Array<ICalendarAccountsItem> {}

const CalendarAccounts = () => {
  const items: ICalendarAccountsItems = [
    {
      logo: 'google-calendar.svg',
      title: 'Google',
      email: 'jasontt@studio.co'
    },
    {
      logo: 'monday.svg',
      title: 'Monday',
      email: 'jasontatum@keenthemes.com'
    }
  ];

  const renderItem = (item: ICalendarAccountsItem, index: number) => {
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center flex-wrap gap-3.5">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
            className="size-6 shrink-0"
            alt=""
          />

          <div className="flex flex-col">
            <a
              href="#"
              className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
            >
              {item.title}
            </a>
            <a href="#" className="text-2sm text-gray-700 hover:text-primary-active">
              {item.email}
            </a>
          </div>
        </div>

        <div className="btn btn-sm btn-icon btn-clear btn-light">
          <KeenIcon icon="trash" />
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Calendar Accounts <span className="text-gray-600 font-medium text-2sm">1/5</span>
        </h3>

        <button className="btn btn-light btn-sm">
          <KeenIcon icon="calendar-remove" />
          Add New
        </button>
      </div>

      <div className="card-body">
        <div className="grid gap-2.5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { CalendarAccounts, type ICalendarAccountsItem, type ICalendarAccountsItems };
