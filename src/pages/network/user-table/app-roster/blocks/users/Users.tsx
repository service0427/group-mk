import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import {
  DataGrid,
  KeenIcon,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  useDataGrid
} from '@/components';
import { ColumnDef, Column, RowSelectionState } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { UsersData, IUsersData } from './';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Users = () => {
  const ColumnInputFilter = <TData, TValue>({ column }: IColumnFilterProps<TData, TValue>) => {
    return (
      <Input
        placeholder="Filter..."
        value={(column.getFilterValue() as string) ?? ''}
        onChange={(event) => column.setFilterValue(event.target.value)}
        className="h-9 w-full max-w-40"
      />
    );
  };

  const [users, setUsers] = useState<IUsersData[]>(UsersData); // Initialize state with UsersData

  const handleToggle = (index: number) => {
    setUsers((prevUsers) => {
      const updatedUsers = [...prevUsers];
      updatedUsers[index] = {
        ...updatedUsers[index],
        switch: !updatedUsers[index].switch // Toggle the switch state
      };
      return updatedUsers;
    });
  };

  const columns = useMemo<ColumnDef<IUsersData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: 'w-0'
        }
      },
      {
        accessorFn: (row: IUsersData) => row.user,
        id: 'users',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Users"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2.5">
              <img
                src={toAbsoluteUrl(`/media/avatars/${row.original.user.avatar}`)}
                className="rounded-full size-7 shrink-0"
                alt={`${row.original.user.userName}`}
              />

              <Link to="#" className="text-sm font-medium text-gray-900 hover:text-primary-active">
                {row.original.user.userName}
              </Link>
            </div>
          );
        },
        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'font-normal text-gray-800'
        }
      },
      {
        accessorFn: (row) => row.phone,
        id: 'phone',
        header: ({ column }) => <DataGridColumnHeader title="Phone" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.phone;
        },
        meta: {
          className: 'min-w-[165px]',
          cellClassName: 'font-normal text-gray-800'
        }
      },
      {
        accessorFn: (row) => row.branch,
        id: 'branch',
        header: ({ column }) => <DataGridColumnHeader title="Branch" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.branch;
        },
        meta: {
          className: 'min-w-[165px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.logos,
        id: 'image',
        header: ({ column }) => <DataGridColumnHeader title="Connected Apps" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <div className="flex items-center text-gray-800 font-normal gap-1.5">
              {Array.isArray(info.row.original.logos) &&
                info.row.original.logos.map((logo, index) => (
                  <img
                    key={index}
                    src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
                    className="size-[18px] shrinc-0"
                    alt={``}
                  />
                ))}
            </div>
          );
        },
        meta: {
          className: 'min-w-[165px]'
        }
      },
      {
        accessorFn: (row) => row.labels,
        id: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Tags" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <div className="flex items-center text-gray-800 font-normal gap-1.5">
              {Array.isArray(info.row.original.labels) &&
                info.row.original.labels.map((label, index) => (
                  <span key={index} className="badge badge-sm">
                    {label}
                  </span>
                ))}
            </div>
          );
        },
        meta: {
          className: 'min-w-[225px]'
        }
      },
      {
        accessorFn: (row) => row.switch,
        id: 'switch',
        header: ({ column }) => <DataGridColumnHeader title="Enforce 2FA" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const userSwitch = row.original.switch; // Har bir foydalanuvchining switch holati
          return (
            <div className="flex items-center mb-2">
              <label className="switch switch-sm">
                <input
                  type="checkbox"
                  checked={userSwitch}
                  onChange={() => handleToggle(row.index)} // Use row.index for the correct user
                />
                <span className="slider round"></span>
              </label>
            </div>
          );
        },
        meta: {
          className: 'min-w-[100px]'
        }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: () => {
          return (
            <button className="btn btn-sm btn-icon btn-clear btn-light">
              <KeenIcon icon="dots-vertical" />
            </button>
          );
        },
        meta: {
          headerClassName: 'w-[60px]'
        }
      }
    ],
    []
  );

  const data: IUsersData[] = useMemo(() => users, [users]); // Use users state

  const handleRowSelection = (state: RowSelectionState) => {
    const selectedRowIds = Object.keys(state);

    if (selectedRowIds.length > 0) {
      toast(`Total ${selectedRowIds.length} are selected.`, {
        description: `Selected row IDs: ${selectedRowIds}`,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo')
        }
      });
    }
  };

  const Toolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState('');

    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">Showing 10 of 49,053 users</h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search users"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Select defaultValue="active">
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="w-32">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="latest">
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="w-32">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="older">Older</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

            <button className="btn btn-sm btn-outline btn-primary">
              <KeenIcon icon="setting-4" /> Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataGrid
      columns={columns}
      data={data}
      rowSelection={true}
      onRowSelectionChange={handleRowSelection}
      pagination={{ size: 5 }}
      sorting={[{ id: 'phone', desc: false }]}
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { Users };
