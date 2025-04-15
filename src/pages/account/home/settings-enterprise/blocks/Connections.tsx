import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useLanguage } from '@/i18n';
import { DropdownCard2, DropdownCardItem1 } from '@/partials/dropdowns/general';

interface IConnection {
  avatar: string;
  name: string;
  connections: number | 'none';
  jointLinks: number | 'none';
}
interface IConnections extends Array<IConnection> {}

const Connections = () => {
  const { isRTL } = useLanguage();

  const tables: IConnections = [
    {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      connections: 26,
      jointLinks: 6
    },
    {
      avatar: '300-1.png',
      name: 'Esther Howard',
      connections: 639,
      jointLinks: 'none'
    },
    {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      connections: 125,
      jointLinks: 19
    },
    {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      connections: 81,
      jointLinks: 'none'
    },
    {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      connections: 1203,
      jointLinks: 2
    },
    {
      avatar: '300-9.png',
      name: 'Guy Hawkins',
      connections: 2,
      jointLinks: 'none'
    }
  ];

  const renderItem = (table: IConnection, index: number) => {
    return (
      <tr key={index}>
        <td className="py-3.5">
          <div className="flex items-center grow gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${table.avatar}`)}
              className="rounded-full size-9 shrink-0"
              alt=""
            />

            <div className="flex flex-col gap-0.5">
              <a
                href="#"
                className="text-sm font-smedium text-gray-900 hover:text-primary-active mb-px"
              >
                {table.name}
              </a>
              <span className="text-xs font-normal text-gray-700">
                {table.connections} connections
              </span>
            </div>
          </div>
        </td>

        <td className="py-2 text-end text-gray-600 font-nmedium">{table.jointLinks}</td>

        <td className="py-2 text-end">
          <button className="btn btn-xs btn-icon btn-primary rounded-full">
            <KeenIcon icon="check" />
          </button>
        </td>

        <td className="text-end">
          <Menu className="inline-flex">
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
              {DropdownCardItem1()}
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Connections</h3>

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

      <div className="card-table scrollable-x-auto">
        <div className="scrollable-auto">
          <table className="table align-middle text-2sm text-gray-600">
            <tbody>
              <tr className="bg-gray-100">
                <th className="text-start font-medium min-w-48 py-2.5">Name</th>
                <th className="text-end font-medium min-w-28 py-2.5">Joint Links</th>
                <th className="text-end font-medium min-w-20 py-2.5">Status</th>
                <th className="min-w-16"></th>
              </tr>

              {tables.map((table, index) => {
                return renderItem(table, index);
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-footer justify-center">
        <a href="#" className="btn btn-link">
          View 64 more
        </a>
      </div>
    </div>
  );
};

export { Connections, type IConnection, type IConnections };
