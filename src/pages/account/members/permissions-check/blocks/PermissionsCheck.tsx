interface IPermissionsCheckItem {
  module: string;
  view: boolean;
  modify: boolean;
  publish: boolean;
  configure: boolean;
}
interface IPermissionsCheckItems extends Array<IPermissionsCheckItem> {}

const PermissionsCheck = () => {
  const data: IPermissionsCheckItems = [
    {
      module: 'Workspace Settings',
      view: true,
      modify: true,
      publish: true,
      configure: true
    },
    {
      module: 'Billing Management',
      view: true,
      modify: false,
      publish: false,
      configure: false
    },
    {
      module: 'Integration Setup',
      view: true,
      modify: true,
      publish: false,
      configure: false
    },
    {
      module: 'Map Creation',
      view: true,
      modify: true,
      publish: true,
      configure: true
    },
    {
      module: 'Data Export',
      view: true,
      modify: false,
      publish: false,
      configure: false
    },
    {
      module: 'User Roles',
      view: true,
      modify: false,
      publish: false,
      configure: false
    },
    {
      module: 'Security Settings',
      view: true,
      modify: false,
      publish: false,
      configure: false
    },
    {
      module: 'Insights Access',
      view: false,
      modify: false,
      publish: false,
      configure: false
    },
    {
      module: 'Merchant List',
      view: true,
      modify: true,
      publish: false,
      configure: false
    }
  ];

  const renderItem = (each: IPermissionsCheckItem, index: number) => {
    return (
      <tr key={index}>
        <td className="!py-5.5">{each.module}</td>
        <td className="!py-5.5 text-center">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            value=""
            name=""
            defaultChecked={each.view}
          />
        </td>
        <td className="!py-5.5 text-center">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            value=""
            name=""
            defaultChecked={each.modify}
          />
        </td>
        <td className="!py-5.5 text-center">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            value=""
            name=""
            defaultChecked={each.publish}
          />
        </td>
        <td className="!py-5.5 text-center">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            value=""
            name=""
            defaultChecked={each.configure}
          />
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header gap-2">
        <h3 className="card-title">
          <a href="#" className="link">
            Project Manager
          </a>
          &nbsp;Role Permissions
        </h3>

        <div className="flex gap-5">
          <a href="#" className="btn btn-sm btn-light btn-outline shrink-0">
            New Permission
          </a>
        </div>
      </div>
      <div className="card-table scrollable-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="text-start text-gray-300 font-normal min-w-[300px]">Module</th>
              <th className="min-w-24 text-gray-700 font-normal text-center">View</th>
              <th className="min-w-24 text-gray-700 font-normal text-center">Modify</th>
              <th className="min-w-24 text-gray-700 font-normal text-center">Publish</th>
              <th className="min-w-24 text-gray-700 font-normal text-center">Configure</th>
            </tr>
          </thead>
          <tbody className="text-gray-900 font-medium">
            {data.map((each, index) => {
              return renderItem(each, index);
            })}
          </tbody>
        </table>
      </div>
      <div className="card-footer justify-end py-7.5 gap-2.5">
        <a href="#" className="btn btn-light btn-outline">
          Restore Defaults
        </a>
        <a href="#" className="btn btn-primary">
          Save Changes
        </a>
      </div>
    </div>
  );
};

export { PermissionsCheck, type IPermissionsCheckItem, type IPermissionsCheckItems };
