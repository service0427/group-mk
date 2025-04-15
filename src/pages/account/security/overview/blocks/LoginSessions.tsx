import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { useLanguage } from '@/i18n';
import { DropdownCardItem1, DropdownCrud1 } from '@/partials/dropdowns/general';
import { CommonAvatar } from '@/partials/common';

interface ILoginSessionsItem {
  avatar: string;
  name: string;
  connections: number;
  location: string;
  recent: string;
}
interface ILoginSessionsItems extends Array<ILoginSessionsItem> {}

const LoginSessions = () => {
  const { isRTL } = useLanguage();

  const rows: ILoginSessionsItems = [
    {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      connections: 26,
      location: 'New Zealand',
      recent: 'Current session'
    },
    {
      avatar: '300-1.png',
      name: 'Esther Howard',
      connections: 639,
      location: 'Canada',
      recent: 'Week ago'
    },
    {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      connections: 125,
      location: 'Malaysia',
      recent: 'Today, 9:53 am'
    },
    {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      connections: 81,
      location: 'Turkey',
      recent: 'Current session'
    },
    {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      connections: 1203,
      location: 'United States',
      recent: 'Month ago'
    }
  ];

  const renderItem = (row: ILoginSessionsItem, index: number) => {
    return (
      <tr key={index}>
        <td>
          <div className="flex items-center grow gap-2.5">
            <CommonAvatar image={row.avatar} imageClass="rounded-full size-9 shrink-0" />

            <div className="flex flex-col gap-0.5">
              <a href="#" className="text-sm font-medium text-gray-900 hover:text-primary-actives">
                {row.name}
              </a>
              <span className="text-xs font-normal text-gray-700">
                {row.connections} connections
              </span>
            </div>
          </div>
        </td>

        <td className="text-end text-gray-700 font-normal">{row.location}</td>

        <td className="text-end text-gray-700 font-normal">{row.recent}</td>

        <td className="!pr-7.5">
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
                      offset: isRTL() ? [0, 10] : [0, -10] // [skid, distance]
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
        <h3 className="card-title">Login Sessions</h3>

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
                    offset: isRTL() ? [0, 10] : [0, -10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCrud1()}
          </MenuItem>
        </Menu>
      </div>

      <div className="card-table scrollable-x-auto">
        <div className="scrollable-auto">
          <table className="table align-middle text-gray-700 text-sm">
            <thead>
              <tr>
                <th className="text-start min-w-48">Name</th>
                <th className="text-end min-w-20">Location</th>
                <th className="text-end min-w-20">Recent activity</th>
                <th className="text-end w-[70px]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                return renderItem(row, index);
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-footer justify-center">
        <a href="{{ url }}" className="btn btn-link">
          View 64 more
        </a>
      </div>
    </div>
  );
};

export { LoginSessions, type ILoginSessionsItem, type ILoginSessionsItems };
