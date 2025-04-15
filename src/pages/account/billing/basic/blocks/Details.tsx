import { KeenIcon } from '@/components';
interface IDetailsItem {
  status: string;
  info: string;
}
interface IDetailsItems extends Array<IDetailsItem> {}

const Details = () => {
  const tables: IDetailsItems = [
    { status: 'Company Name', info: 'KeenThemes' },
    { status: 'Address', info: 'Keizersgracht 136, 1015 CW Amsterdam, Netherlands' },
    { status: 'Contact', info: 'Jason Tatum' },
    { status: 'VAT ID', info: 'NL123456789B01' }
  ];

  const renderItem = (table: IDetailsItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 min-w-36 pb-5 pe-6">{table.status}</td>
        <td className="text-sm text-gray-800 pb-5">{table.info}</td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Billing Details</h3>

        <button className="btn btn-light btn-sm">
          <KeenIcon icon="notepad-edit" />
          Edit Billing
        </button>
      </div>

      <div className="card-body pt-4 pb-2">
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

export { Details, type IDetailsItem, type IDetailsItems };
