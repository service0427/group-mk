/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid, DefaultTooltip } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { DeviceData, IDeviceData } from '.';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Device = () => {
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

  const columns = useMemo<ColumnDef<IDeviceData>[]>(
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
        accessorFn: (row: IDeviceData) => row.device,
        id: 'device',
        header: ({ column }) => <DataGridColumnHeader title="Device" filter={<ColumnInputFilter column={column} />} column={column} />,
        enableSorting: true,
        cell: ({ row }) => {  // 'row' argumentini cell funksiyasiga qo'shdik
          return (
            <div className="flex items-center gap-4">
              <KeenIcon icon={row.original.device.icon} className="text-2xl text-gray-500" />

              <div className="flex flex-col gap-0.5">
                <span className="leading-none font-medium text-sm text-gray-900">
                  {row.original.device.name}
                </span>
                <span className="text-2sm text-gray-700 font-normal">
                  {row.original.device.browser}
                </span>
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[250px]',
          cellClassName: 'text-sm text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.ipAddress,
        id: 'ipAddress',
        header: ({ column }) => <DataGridColumnHeader title="IP Address" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.ipAddress;
        },
        meta: {
          headerTitle: 'IP Address',
          headerClassName: 'min-w-[165px]',
          cellClassName: 'text-sm text-gray-800 font-normal'
        }
      },   
      {
        accessorFn: (row) => row.location,
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title="Location" column={column} />,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.location;
        },
        meta: {
          headerClassName: 'min-w-[165px]',
          cellClassName: 'text-sm text-gray-800 font-normal'
        }
      },  
      {
        accessorFn: (row) => row.added,
        id: 'added',
        header: ({ column }) => (
          <div className="flex items-center">
            <DefaultTooltip title="Time is based on your local timezone." placement="left" className="max-w-48">
              <KeenIcon icon="information-2" className="text-lg leading-none me-1 mb-0.5" />
            </DefaultTooltip>
            <DataGridColumnHeader title="Added" column={column} />
          </div> 
        ),
        enableSorting: true,
        meta: {
          headerClassName: 'min-w-[165px]',
          cellClassName: 'text-sm text-gray-800 font-normal'
        }
      },  
      {
        accessorFn: (row) => row.lastSession,
        id: 'lastSession',
        header: ({ column }) => <DataGridColumnHeader title="Last Session" column={column} />,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.lastSession;
        },
        meta: {
          headerTitle: 'Last Session',
          headerClassName: 'min-w-[165px]',
          cellClassName: 'text-sm text-gray-800 font-normal'
        }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: () => {                    
          return (
            <button className="btn btn-sm btn-icon btn-clear btn-light">
              <KeenIcon icon="notepad-edit" /> 
            </button>
          );
        },
        meta: {
          headerClassName: 'w-[60px]'
        }
      },      
      {
        id: 'trash',
        header: () => '',
        enableSorting: false,
        cell: () => {                    
          return (
            <button className="btn btn-sm btn-icon btn-clear btn-light"> 
              <KeenIcon icon="trash" />
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

  const data: IDeviceData[] = useMemo(() => DeviceData, []);

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
      <div className="card-header px-5 py-5 border-b-0 flex-wrap">
        <h3 className="card-title">Devices</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href="#" className="btn btn-sm btn-primary">Add Device</a>
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
      sorting={[{ id: 'device', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  )
};

export { Device };
