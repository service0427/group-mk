import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { useLanguage } from '@/i18n';
import { DropdownCard2, DropdownCardItem2 } from '@/partials/dropdowns/general';

interface IRecentInvoicesItem {
  icon: string;
  number: string;
  date: string;
  ammount: string;
}
interface IRecentInvoicesItems extends Array<IRecentInvoicesItem> {}

const RecentInvoices = () => {
  const { isRTL } = useLanguage();

  const items: IRecentInvoicesItems = [
    {
      icon: 'cheque',
      number: 'INV-2023-001',
      date: '15 Nov, 2023',
      ammount: '500.00'
    },
    {
      icon: 'tag',
      number: 'INV-2023-002',
      date: '30 Nov, 2023',
      ammount: '750.00'
    },
    {
      icon: 'discount',
      number: 'INV-2023-003',
      date: '10 Dec, 2023',
      ammount: '1,200.00'
    },
    {
      icon: 'purchase',
      number: 'INV-2023-004',
      date: '05 Dec, 2023',
      ammount: '300.00'
    },
    {
      icon: 'shop',
      number: 'INV-2023-005',
      date: '20 Nov, 2023',
      ammount: '950.00'
    }
  ];

  const renderItem = (item: IRecentInvoicesItem, index: number) => {
    return (
      <div key={index} className="flex justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7.5 shrink-0 bg-gray-100 rounded-lg border border-gray-300">
            <KeenIcon icon={item.icon} className="text-base text-gray-600" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-2sm font-medium text-gray-900 cursor-pointer hover:text-primary mb-px">
              {item.number}
            </span>
            <span className="text-2xs text-gray-700">{item.date}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-sm text-gray-800">${item.ammount}</span>

          <Menu>
            <MenuItem
              toggle="dropdown"
              trigger="click"
              dropdownProps={{
                placement: isRTL() ? 'bottom-start' : 'bottom-end',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                    }
                  }
                ]
              }}
            >
              <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                <KeenIcon icon="dots-vertical" />
              </MenuToggle>
              {DropdownCardItem2()}
            </MenuItem>
          </Menu>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Invoices</h3>

        <Menu>
          <MenuItem
            toggle="dropdown"
            trigger="click"
            dropdownProps={{
              placement: isRTL() ? 'bottom-start' : 'bottom-end',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCard2()}
          </MenuItem>
        </Menu>
      </div>
      <div className="card-body">
        <div className="grid gap-5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { RecentInvoices, type IRecentInvoicesItem, type IRecentInvoicesItems };
