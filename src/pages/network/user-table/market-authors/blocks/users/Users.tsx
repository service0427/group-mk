/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, KeenIcon, useDataGrid, DataGridRowSelectAll, DataGridRowSelect } from '@/components';
import { CommonRating } from '@/partials/common';
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
        header: ({ column }) => <DataGridColumnHeader title="Author" filter={<ColumnInputFilter column={column}/>} column={column} />,  
        enableSorting: true,
        cell: ({ row }) => {  // 'row' argumentini cell funksiyasiga qo'shdik
          return (
            <div className="flex items-center gap-2.5">
              <img
                src={toAbsoluteUrl(`/media/avatars/${row.original.user.avatar}`)}
                className="rounded-full size-7 shrink-0"
                alt={`${row.original.user.userName}`}
              />

              <div className="flex flex-col">
                <Link to="#" className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px">
                  {row.original.user.userName}
                </Link>
                
                <span className="text-2sm text-gray-700 font-normal">
                  {row.original.user.description}
                </span> 
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[250px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },
      {
        accessorFn: (row) => row.total,
        id: 'total',
        header: ({ column }) => <DataGridColumnHeader title="Earnings" column={column}/>,   
        enableSorting: true,
        cell: (info) => {
          return info.row.original.total;
        },
        meta: {
          headerClassName: 'w-[150px]',
          cellClassName: 'font-normal text-gray-800'
        }
      },   
      {
        accessorFn: (row) => row.team,
        id: 'team',
        header: ({ column }) => <DataGridColumnHeader title="Team" column={column}/>,  
        enableSorting: true,
        cell: (info) => {                    
          return (
            
            <div className="flex items-center text-gray-800 font-normal gap-1.5">
              <img 
                src={toAbsoluteUrl(`/media/brand-logos/${info.row.original.team.logo}`)} 
                className="w-5 shrinc-0"
                alt={``}
              />
              {info.row.original.team.label}
            </div>
          );
        }, 
        meta: {
          headerClassName: 'min-w-[175px]' 
        }
      },   
      {
        accessorFn: (row) => row.products,
        id: 'products',
        header: ({ column }) => <DataGridColumnHeader title="Products" column={column}/>,   
        enableSorting: true,
        cell: (info) => {
          return info.row.original.products;
        },
        meta: {
          headerClassName: 'min-w-[150px]',
          cellClassName: 'font-normal text-gray-800'
        }
      },    
      {
        accessorFn: (row) => row.rating.value,
        id: 'rating',
        header: ({ column }) => <DataGridColumnHeader title="Rating" column={column}/>,    
        enableSorting: true,
        cell: (info) => (
          <CommonRating
            rating={info.row.original.rating.value}
            round={info.row.original.rating.round}
          />
        ),
        meta: {
          headerClassName: 'w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        } 
      },
      {
        id: 'social',
        header: ({ column }) => <DataGridColumnHeader title="Social Profiles" column={column}/>,   
        enableSorting: false,
        cell: () => {                    
          return (
            <div className="flex items-center gap-2.5">
              <Link to="#">
                <KeenIcon icon="facebook" className='text-gray-500 text-lg'/> 
              </Link>

              <Link to="#">
                <KeenIcon icon="dribbble" className='text-gray-500 text-lg'/> 
              </Link>

              <Link to="#">
                <KeenIcon icon="tiktok" className='text-gray-500 text-lg'/> 
              </Link> 
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[150px]'
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
      },      
        
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
      sorting={[{ id: 'team', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />  
  );
};

export { Users };
