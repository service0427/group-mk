interface IHighlightsItem {
  label: string;
  info: string;
  type?: number;
}
interface IHighlightsItems extends Array<IHighlightsItem> {}

const Highlights = () => {
  const items: IHighlightsItems = [
    { label: 'Locations:', info: '79', type: 1 },
    { label: 'Founded:', info: '2011', type: 2 },
    {
      label: 'Status:',
      info: '<span class="badge badge-sm badge-success badge-outline">Subscribed</span>'
    },
    { label: 'Area:', info: 'Worldwide' },
    {
      label: 'CEO:',
      info: '<a href="#" class="text-primary hover:text-primary-active">Luis von Ahn</a>'
    },
    { label: 'Sector:', info: 'Online Education' }
  ];

  const renderItems = (item: IHighlightsItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-10">{item.label}</td>
        <td className="text-sm ext-gray-900 pb-3">
          {item.type === 1 ? (
            item.info
          ) : item.type === 2 ? (
            item.info
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
        <h3 className="card-title">Highlights</h3>
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

export { Highlights, type IHighlightsItem, type IHighlightsItems };
