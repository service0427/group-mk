/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
import { ColumnDef, Column, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, KeenIcon, useDataGrid, DataGridRowSelectAll, DataGridRowSelect } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { VisitorsData, IVisitorsData } from '.';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Visitors = () => {
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

  const columns = useMemo<ColumnDef<IVisitorsData>[]>(
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
        header: ({ column }) => <DataGridColumnHeader title="User" filter={<ColumnInputFilter column={column}/>} column={column} />,   
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <div className="shrink-0">
              <img
                src={toAbsoluteUrl(`/media/avatars/${info.row.original.user.avatar}`)}
                className="size-7 rounded-full"
                alt=""
              />
            </div>
            <a className="text-sm font-font-medium text-gray-900 hover:text-primary-active" href="#">
              {info.row.original.user.name}
            </a>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        },
      },
      {
        accessorFn: (row) => row.browser,
        id: 'browser',
        header: ({ column }) => <DataGridColumnHeader title="Browser" column={column}/>,  
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-gray-800 font-normal">
            <KeenIcon icon="chrome" />
            <span>{info.row.original.browser}</span>
          </div>
        ),
        meta: {
          headerClassName: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        },
      },
      {
        accessorFn: (row) => row.ipAddress,
        id: 'ipAddress',
        header: ({ column }) => <DataGridColumnHeader title="IP Address" column={column}/>,   
        enableSorting: true,
        cell: (info) => {
          return info.row.original.ipAddress;
        },
        meta: {
          headerClassName: 'min-w-[190px]',
          cellClassName: 'text-gray-700 font-normal',
          headerTitle: 'IP Address',
        },
      },
      {
        accessorFn: (row) => row.location,
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title="Location" column={column}/>,    
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
          headerClassName: 'min-w-[190px]',
          cellClassName: 'text-gray-700 font-normal'
        },
      },
      {
        accessorFn: (row) => row.activity,
        id: 'activity',
        header: ({ column }) => <DataGridColumnHeader title="Activity" column={column}/>,   
        enableSorting: true,
        cell: (info: any) => info.row.original.activity,
        meta: {
          headerClassName: 'min-w-[190px]',
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

  const data: IVisitorsData[] = useMemo(() => VisitorsData, []);
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
      sorting={[{ id: 'user', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />  
  ); 
};

export {Visitors };
