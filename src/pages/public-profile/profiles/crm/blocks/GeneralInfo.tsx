interface IGeneralInfoItem {
  label: string;
  info: string;
  type?: number;
}
interface IGeneralInfoItems extends Array<IGeneralInfoItem> {}

const GeneralInfo = () => {
  const items: IGeneralInfoItems = [
    { label: 'Phone:', info: '+31 6 12345678', type: 1 },
    { label: 'Email:', info: 'jenny@studio.com', type: 2 },
    {
      label: 'Status:',
      info: '<span class="badge badge-sm badge-success badge-outline">Subscribed</span>'
    },
    { label: 'Type:', info: 'Wholesale' },
    { label: 'Encryption:', info: 'Strong' },
    { label: 'Last Order:', info: 'Today at 13:06' },
    { label: 'Signed Up:', info: '2 months ago' }
  ];

  const renderItems = (item: IGeneralInfoItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">{item.label}</td>
        <td className="text-sm text-gray-900 pb-3">
          {item.type === 1 ? (
            <span>{item.info}</span>
          ) : item.type === 2 ? (
            <span>{item.info}</span>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: item.info }}></span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">General Info</h3>
      </div>

      <div className="card-body pt-3.5 pb-3.5">
        <table className="table-auto">
          <tbody>
            {items.map((item, index) => {
              return renderItems(item, index);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { GeneralInfo, type IGeneralInfoItem, type IGeneralInfoItems };
