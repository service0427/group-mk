import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';

import { DropdownCardItem2 } from '@/partials/dropdowns/general';

interface IBillingInvoicingItem {
  number: string;
  date: string;
  ammount: string;
  label: string;
  color: string;
}
interface IBillingInvoicingItems extends Array<IBillingInvoicingItem> {}

const BillingInvoicing = () => {
  const tables: IBillingInvoicingItems = [
    {
      number: 'Invoice-2024-xd912c',
      date: '6 Aug, 2024',
      ammount: '24.00',
      label: 'Upcoming',
      color: 'badge-warning'
    },
    {
      number: 'Invoice-2024-rq857m',
      date: '17 Jun, 2024',
      ammount: '29.99',
      label: 'Paid',
      color: 'badge-success'
    },
    {
      number: 'Invoice-2024-hg234x',
      date: '21 Apr, 2024',
      ammount: '6.59',
      label: 'Declined',
      color: 'badge-danger'
    },
    {
      number: 'Invoice-2024-lp098y',
      date: '14 mar, 2024',
      ammount: '24.00',
      label: 'Paid',
      color: 'badge-success'
    }
  ];

  const renderItem = (table: IBillingInvoicingItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-800">{table.number}</td>
        <td className="lg:text-end">
          <div className={`badge badge-sm ${table.color} badge-outline`}>{table.label}</div>
        </td>
        <td className="text-sm text-gray-800 lg:text-end">{table.date}</td>
        <td className="text-sm text-gray-800 lg:text-end">${table.ammount}</td>
        <td>
          <Menu className="items-stretch">
            <MenuItem
              toggle="dropdown"
              trigger="click"
              dropdownProps={{
                placement: 'bottom-end',
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
              <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear mb-2.5-">
                <KeenIcon icon="dots-vertical" />
              </MenuToggle>
              {DropdownCardItem2()}
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Billing and Invoicing</h3>

        <button className="btn btn-light btn-sm">
          <KeenIcon icon="exit-down" />
          Download All
        </button>
      </div>

      <div className="card-table scrollable-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="min-w-50">Invoice</th>
              <th className="min-w-16 text-end">Status</th>
              <th className="min-w-30 text-end">Date</th>
              <th className="min-w-16 text-end">Amount</th>
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

export { BillingInvoicing, type IBillingInvoicingItem, type IBillingInvoicingItems };
