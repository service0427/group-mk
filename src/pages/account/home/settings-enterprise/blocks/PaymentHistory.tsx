import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { useLanguage } from '@/i18n';
import { DropdownCrud2, DropdownCrudItem1 } from '@/partials/dropdowns/general';

interface IPaymentHistoryItem {
  date: string;
  type: string;
  amount: string;
}
interface IPaymentHistoryItems extends Array<IPaymentHistoryItem> {}

const PaymentHistory = () => {
  const { isRTL } = useLanguage();

  const tables: IPaymentHistoryItems = [
    {
      date: '24 Aug, 2024',
      type: 'Subscription Fee',
      amount: '$24.00'
    },
    {
      date: '15 Sep, 2024',
      type: 'Product Purchase',
      amount: '$50.99'
    },
    {
      date: '05 Dec, 2024',
      type: 'Transaction Fee',
      amount: '$2.50'
    },
    {
      date: '30 May, 2025',
      type: 'Annual Maintenance',
      amount: '$40.20'
    }
  ];

  const renderItem = (table: IPaymentHistoryItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm font-normal text-gray-800">{table.date}</td>
        <td className="text-sm font-normal text-gray-800 lg:text-end">{table.type}</td>
        <td className="text-sm font-normal text-gray-800 lg:text-end">{table.amount}</td>
        <td>
          <Menu className="items-stretch">
            <MenuItem
              toggle="dropdown"
              trigger="click"
              dropdownProps={{
                placement: isRTL() ? 'bottom-start' : 'bottom-end',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 10] // [skid, distance]
                    }
                  }
                ]
              }}
            >
              <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                <KeenIcon icon="dots-vertical" />
              </MenuToggle>
              {DropdownCrudItem1()}
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header gap-2">
        <h3 className="card-title">Payment History</h3>

        <Menu className="items-stretch">
          <MenuItem
            toggle="dropdown"
            trigger="click"
            dropdownProps={{
              placement: isRTL() ? 'bottom-start' : 'bottom-end',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCrud2()}
          </MenuItem>
        </Menu>
      </div>
      <div className="card-table scrollable-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="min-w-40">Date</th>
              <th className="min-w-40 lg:text-end">Type</th>
              <th className="min-w-40 lg:text-end">Amount</th>
              <th className="w-8"></th>
            </tr>
          </thead>

          <tbody>
            {tables.map((table, index) => {
              return renderItem(table, index);
            })}
          </tbody>
        </table>
      </div>
      <div className="card-footer justify-center">
        <a href="#" className="btn btn-link">
          View all Payments
        </a>
      </div>
    </div>
  );
};

export { PaymentHistory, type IPaymentHistoryItem, type IPaymentHistoryItems };
