import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';

interface ILatestPaymentItem {
  status: string;
  logo?: boolean;
  info: string;
}
interface ILatestPaymentItems extends Array<ILatestPaymentItem> {}

const LatestPayment = () => {
  const tables: ILatestPaymentItems = [
    { status: 'Typ of Plan', info: 'Cloud One Enterprise' },
    { status: 'Payment Date', info: '6 Aug, 2024' },
    { status: 'Card used to pay:', logo: true, info: 'Ending 3604' },
    { status: 'Total Payment:', info: '$24.00' }
  ];

  const renderItem = (table: ILatestPaymentItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 min-w-36 pb-5 pe-6">{table.status}</td>
        <td className="flex items-center gap-2.5 text-sm text-gray-800">
          {table.logo && (
            <img
              src={toAbsoluteUrl('/media/brand-logos/visa.svg')}
              className="w-10 shrink-0"
              alt=""
            />
          )}

          {table.info}
        </td>
      </tr>
    );
  };

  return (
    <div className="card grow">
      <div className="card-header">
        <h3 className="card-title">Latest Payment</h3>

        <button className="btn btn-light btn-sm">
          <KeenIcon icon="exit-down" />
          Download PDF
        </button>
      </div>

      <div className="card-body pt-4 pb-3">
        <table className="table-auto">
          <tbody>
            {tables.map((table, index) => {
              return renderItem(table, index);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { LatestPayment, type ILatestPaymentItem, type ILatestPaymentItems };
