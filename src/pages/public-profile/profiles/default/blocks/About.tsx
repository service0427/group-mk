interface IAboutTable {
  status: string;
  info: string;
}
interface IAboutTables extends Array<IAboutTable> {}

const About = () => {
  const tables: IAboutTables = [
    { status: 'Age', info: '32' },
    { status: 'City:', info: 'Amsterdam' },
    { status: 'State:', info: 'North Holland' },
    { status: 'Country:', info: 'Netherlands' },
    { status: 'Postcode:', info: '1092 NL' },
    { status: 'Phone:', info: '+31 6 1234 56 78' },
    {
      status: 'Email:',
      info: '<a href="#" class="text-gray-800 hover:text-primary-active">jenny@ktstudio.com</a>'
    }
  ];

  const renderTable = (table: IAboutTable, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 pb-3.5 pe-3">{table.status}</td>
        <td
          className="text-sm text-gray-900 pb-3.5"
          dangerouslySetInnerHTML={{ __html: table.info }}
        />
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">About</h3>
      </div>

      <div className="card-body pt-4 pb-3">
        <table className="table-auto">
          <tbody>
            {tables.map((table, index) => {
              return renderTable(table, index);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { About, type IAboutTable, type IAboutTables };
