/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, DefaultTooltip, KeenIcon, useDataGrid } from '@/components';
import { IPAddressesData, IIPAddressesData } from '.';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const IPAddresses = () => {
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

  const columns = useMemo<ColumnDef<IIPAddressesData>[]>(
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
        accessorFn: (row) => row.status,
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column}/>, 
        enableSorting: true,
        cell: (info) => (
          <span className={`badge badge-dot size-2 ${info.row.original.status}`}></span>
        ),
        meta: {
          headerClassName: 'w-[100px]',
          cellClassName: 'text-center'
        },
      },
      {
        accessorFn: (row) => row.ipAddress,
        id: 'ipAddress',
        header: ({ column }) => <DataGridColumnHeader title="IP Address" filter={<ColumnInputFilter column={column}/>} column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'IP Address',
          headerClassName: 'min-w-[170px]',
        },
      },
      {
        accessorFn: (row) => row.lastSession,
        id: 'lastSession',
        header: ({ column }) => <DataGridColumnHeader title="Last Session" column={column}/>,  
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'Last Session',
          headerClassName: 'w-[185px]',
        },
      },
      {
        accessorFn: (row) => row.label,
        id: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Label" column={column}/>,  
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerClassName: 'min-w-[185px]',
        },
      },
      {
        accessorFn: (row) => row.method,
        id: 'method',
        header: ({ column }) => (
          <div className="flex items-center">
            <DefaultTooltip title="Verify the identity of a user trying to access a resource" placement="left" className="max-w-48">
              <KeenIcon icon="information-2" className="text-lg leading-none me-1 mb-0.5" />
            </DefaultTooltip>
            <DataGridColumnHeader title="Method" column={column} />
          </div> 
        ),
        enableSorting: true,
        meta: {
          headerClassName: 'w-[185px]',
        },
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button 
            className="btn btn-sm btn-icon btn-clear btn-light" 
            onClick={() => alert(`Clicked on edit for ${row.original.label}`)}
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        ),
        meta: {
          headerClassName: 'w-[60px]',
        },
      },
      {
        id: 'delete',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button 
            className="btn btn-sm btn-icon btn-clear btn-light" 
            onClick={() => alert(`Clicked on delete for ${row.original.label}`)}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: {
          headerClassName: 'w-[60px]',
        },
      },
    ],
    []
  );

  const data: IIPAddressesData[] = useMemo(() => IPAddressesData, []);

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
      <div className="card-header border-b-0 px-5 flex-wrap">
        <h3 className="card-title">IP Addresses</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="switch switch-sm">
            <span className="switch-label">
              IP Allowlist Enabled
            </span>
            <input type="checkbox" value="1" name="check" defaultChecked readOnly />
          </label>
          <a href="#" id="select_ip_btn" className="btn btn-sm btn-primary">Add IP Address</a>
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
      sorting={[{ id: 'ipAddress', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  ); 
};

export { IPAddresses };
