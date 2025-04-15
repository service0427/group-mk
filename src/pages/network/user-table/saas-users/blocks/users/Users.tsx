import { useMemo, useState } from 'react';
import { toAbsoluteUrl } from '@/utils';
import { UsersData } from './UsersData';
import {
  DataGrid,
  DataGridColumnHeader,
  KeenIcon,
  useDataGrid,
  DataGridRowSelectAll,
  DataGridRowSelect
} from '@/components';
import { ColumnDef, Column, RowSelectionState } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

interface IUsersData {
  user: {
    avatar: string;
    name: string;
    email: string;
  };
  labels: string[];
  license: {
    type: string;
    left: string;
  };
  payment: string;
  enforce: boolean;
}

const EnforceSwitch = ({ enforce }: { enforce: boolean }) => {
  return (
    <label className="switch switch-sm">
      <input type="checkbox" checked={enforce} value="1" readOnly />
    </label>
  );
};

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
        id: 'user',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Subscriber"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        enableSorting: true,
        cell: (info: any) => (
          <div className="flex items-center gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${info.row.original.user.avatar}`)}
              className="size-7 rounded-full shrink-0"
              alt=""
            />
            <div className="flex flex-col">
              <a className="font-medium text-gray-900 hover:text-primary-active mb-px" href="#">
                {info.row.original.user.name}
              </a>
              <a className="text-2sm text-gray-700 hover:text-primary-active" href="#">
                {info.row.original.user.email}
              </a>
            </div>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[300px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row: IUsersData) => row.labels,
        id: 'labels',
        header: ({ column }) => <DataGridColumnHeader title="Products" column={column} />,
        enableSorting: true,
        cell: (info: any) => (
          <div className="flex gap-1.5">
            {info.row.original.labels.map((label: string, index: number) => (
              <span key={index} className="badge badge-sm">
                {label}
              </span>
            ))}
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row: IUsersData) => row.license,
        id: 'license',
        header: ({ column }) => <DataGridColumnHeader title="License" column={column} />,
        enableSorting: true,
        cell: (info: any) => (
          <div className="flex flex-col">
            <span className="text-sm text-gray-800 font-medium">
              {info.row.original.license.type}
            </span>
            <span className="text-xs text-gray-600">{info.row.original.license.left}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[175px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row: IUsersData) => row.payment,
        id: 'payment',
        header: ({ column }) => <DataGridColumnHeader title="Latest Payment" column={column} />,
        enableSorting: true,
        cell: (info: any) => info.row.original.payment,
        meta: {
          className: 'min-w-[175px]',
          cellClassName: 'text-gray-800 font-medium'
        }
      },
      {
        accessorFn: (row: IUsersData) => row.enforce,
        id: 'enforce',
        header: ({ column }) => <DataGridColumnHeader title="Enforce 2FA" column={column} />,
        enableSorting: true,
        cell: (info: any) => <EnforceSwitch enforce={info.row.original.enforce} />,
        meta: {
          headerClassName: 'min-w-[137px]',
          cellClassName: 'text-gray-800 font-medium'
        }
      },
      {
        id: 'actions',
        header: ({ column }) => <DataGridColumnHeader title="Invoices" column={column} />,
        enableSorting: true,
        cell: () => <button className="btn btn-link">Download</button>,
        meta: {
          headerClassName: 'w-28',
          cellClassName: 'text-gray-800 font-medium'
        }
      }
    ],
    []
  );

  const data: IUsersData[] = useMemo(() => UsersData, []);

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
        <h3 className="card-title font-medium text-sm">howing 10 of 49,053 users</h3>

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
      sorting={[{ id: 'user', desc: false }]}
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { Users };
