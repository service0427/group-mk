/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { toAbsoluteUrl } from '@/utils';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CurrentSessionsData, ICurrentSessionsData } from '.';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const CurrentSessions = () => {
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

  const columns = useMemo<ColumnDef<ICurrentSessionsData>[]>(
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
        accessorFn: (row) => row.user,
        id: 'user',
        header: ({ column }) => <DataGridColumnHeader title='Person' filter={<ColumnInputFilter column={column} />} column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <div className="shrink-0">
              <img
                src={toAbsoluteUrl(`/media/avatars/${info.row.original.user.avatar}`)}
                className="h-9 rounded-full"
                alt=""
              />
            </div>
            <a className="leading-none font-semibold text-gray-900 hover:text-primary" href="#">
              {info.row.original.user.name}
            </a>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[300px]'
        },
      },
      {
        accessorFn: (row) => row.browser,
        id: 'browser',
        header: ({ column }) => <DataGridColumnHeader title='Browser' column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <KeenIcon icon={info.row.original.browser.icon} className='text-gray-700 text-lg' />
            <span className="text-gray-700">{info.row.original.browser.name}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[240px]',
        },
      },
      {
        accessorFn: (row) => row.ipAddress,
        id: 'ipAddress',
        header: ({ column }) => <DataGridColumnHeader title='IP Address' column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'IP Address',
          headerClassName: 'w-[240px]',
        },
      },
      {
        accessorFn: (row) => row.location,
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title='Location' column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-1.5">
            <img
              src={toAbsoluteUrl(`/media/flags/${info.row.original.location.flag}`)}
              className="h-4 rounded-full"
              alt=""
            />
            <span className="leading-none text-gray-700">{info.row.original.location.name}</span>
          </div>
        ),
        meta: {
          headerClassName: 'w-[200px]',
        },
      },
      {
        id: 'click',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button 
            className="btn btn-icon btn-light btn-clear btn-sm" 
            onClick={() => alert(`Clicked on action button for row ${row.original.user.name}`)}
          >
            <KeenIcon icon="dots-vertical" />
          </button>
        ),
        meta: {
          headerClassName: 'w-[60px]',
        },
      },
    ],
    []
  );

  const data: ICurrentSessionsData[] = useMemo(() => CurrentSessionsData, []);

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

    return (
      <div className="card-header flex-wrap px-5 py-5 border-b-0">
        <h3 className="card-title">Current Sessions</h3>

        <div className="flex items-center flex-wrap gap-2.5">
          <label className="switch switch-sm">
            <span className="switch-label">
              Only Active Users
            </span>
            <input name="check" type="checkbox" value="1" readOnly />
          </label>

          <div className="flex gap-3">
            <Select defaultValue="1">
              <SelectTrigger className="min-w-32" size="sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="min-w-32">
                <SelectItem value="1">All Browsers</SelectItem>
                <SelectItem value="2">Chrome</SelectItem>
                <SelectItem value="3">Firefox</SelectItem>
                <SelectItem value="4">Edge</SelectItem>
                <SelectItem value="5">Safari</SelectItem>
                <SelectItem value="6">Brave</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="3">
              <SelectTrigger className="min-w-32" size="sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="min-w-32">
                <SelectItem value="1">All Locations</SelectItem>
                <SelectItem value="2">London</SelectItem>
                <SelectItem value="3">USA</SelectItem>
                <SelectItem value="4">Japan</SelectItem>
                <SelectItem value="5">Malaysia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataGridColumnVisibility table={table}/>
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
      pagination={{ size: 10 }}
      sorting={[{ id: 'user', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { CurrentSessions };
