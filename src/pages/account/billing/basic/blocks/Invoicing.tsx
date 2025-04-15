import { KeenIcon } from '@/components';
import { Link } from 'react-router-dom';

interface IInvoicingItem {
  number: string;
  date: string;
  ammount: string;
  label: string;
  color: string;
}
interface IInvoicingItems extends Array<IInvoicingItem> {}

const Invoicing = () => {
  const tables: IInvoicingItems = [
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
      number: 'Invoice-2024-jk563z',
      date: '30 Apr, 2024',
      ammount: '24.00',
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

  const renderItem = (table: IInvoicingItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-800 font-normal">{table.number}</td>
        <td className="lg:text-end">
          <div className={`badge badge-sm ${table.color} badge-outline`}>{table.label}</div>
        </td>
        <td className="text-sm text-gray-800 font-normal lg:text-end">{table.date}</td>
        <td className="text-sm text-gray-700 font-normal lg:text-end">${table.ammount}</td>
        <td>
          <div className="btn btn-sm btn-icon btn-clear btn-primary">
            <KeenIcon icon="exit-down" />
          </div>
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
              <th className="min-w-52">Invoice</th>
              <th className="min-w-24 text-end">Status</th>
              <th className="min-w-32 text-end">Date</th>
              <th className="min-w-20 text-end">Amount</th>
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
        <Link to="/account/billing/history" className="btn btn-link">
          View all Payments
        </Link>
      </div>
    </div>
  );
};

export { Invoicing, type IInvoicingItem, type IInvoicingItems };
