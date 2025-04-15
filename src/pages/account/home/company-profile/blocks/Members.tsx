import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useLanguage } from '@/i18n';
import { DropdownCrud1, DropdownCrudItem1 } from '@/partials/dropdowns/general';

interface IMembersItem {
  avatar: string;
  name: string;
  connections: number;
  label: string;
  joined: string;
  disabled: boolean;
}
interface IMembersItems extends Array<IMembersItem> {}

interface IMembersProps {
  url: string;
}

const Members = ({ url }: IMembersProps) => {
  const { isRTL } = useLanguage();

  const tables: IMembersItems = [
    {
      avatar: '300-3.png',
      name: 'Tyler Hero',
      connections: 26,
      label: 'Project Member',
      joined: 'Today',
      disabled: true
    },
    {
      avatar: '300-1.png',
      name: 'Esther Howard',
      connections: 639,
      label: 'Accountant',
      joined: '5 days ago',
      disabled: false
    },
    {
      avatar: '300-11.png',
      name: 'Jacob Jones',
      connections: 125,
      label: 'Data Analyst',
      joined: '3 days ago',
      disabled: false
    },
    {
      avatar: '300-2.png',
      name: 'Cody Fisher',
      connections: 81,
      label: 'Accountant',
      joined: '2 weeks ago',
      disabled: true
    },
    {
      avatar: '300-5.png',
      name: 'Leslie Alexander',
      connections: 1203,
      label: 'Director',
      joined: '3 weeks ago',
      disabled: false
    }
  ];

  const renderItem = (table: IMembersItem, index: number) => {
    return (
      <tr key={index}>
        <td>
          <div className="flex items-center grow gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${table.avatar}`)}
              className="rounded-full size-9 shrink-0"
              alt=""
            />

            <div className="flex flex-col">
              <a
                href="#"
                className="text-sm font-semibold text-gray-900 hover:text-primary-active mb-px"
              >
                {table.name}
              </a>
              <span className="text-xs font-normal text-gray-600">
                {table.connections} connections
              </span>
            </div>
          </div>
        </td>

        <td className="text-end">
          <span className="badge badge-sm badge-outline">{table.label}</span>
        </td>

        <td className="text-end">
          <span
            className={`badge badge-sm badge-outline ${table.disabled ? 'badge-danger' : 'badge-success'}`}
          >
            {table.disabled ? 'Disabled' : 'Enabled'}
          </span>
        </td>

        <td className="text-end text-gray-700 text-sm">{table.joined}</td>

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
              {DropdownCrudItem1()}
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Members</h3>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <label className="switch switch-sm">
              <span className="switch-label">Enforce 2FA</span>
              <input type="checkbox" value="1" name="check" readOnly />
            </label>
          </div>

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
                      offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
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
      </div>

      <div className="card-table scrollable-x-auto">
        <div className="scrollable-auto">
          <table className="table align-middle text-2sm text-gray-600">
            <tbody>
              <tr className="bg-gray-100">
                <th className="text-start font-medium min-w-52">Name</th>
                <th className="text-end font-medium min-w-36">Role</th>
                <th className="text-end font-medium min-w-32">2FA</th>
                <th className="text-end font-medium min-w-20">Joined</th>
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
        <a href={url} className="btn btn-link">
          View 64 more
        </a>
      </div>
    </div>
  );
};

export { Members, type IMembersItem, type IMembersItems, type IMembersProps };
