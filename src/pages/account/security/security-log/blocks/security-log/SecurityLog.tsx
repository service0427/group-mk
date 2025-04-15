/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { SecurityLogData, ISecurityLogData } from '.';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const SecurityLog = () => {
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

  const columns = useMemo<ColumnDef<ISecurityLogData>[]>(
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
        accessorFn: (row) => row.timestamp,
        id: 'timestamp',
        header: ({ column }) => <DataGridColumnHeader title='Timestamp' filter={<ColumnInputFilter column={column} />} column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerClassName: 'min-w-[200px]'
        },
      },
      {
        accessorFn: (row) => row.eventType,
        id: 'eventType',
        header: ({ column }) => <DataGridColumnHeader title='Event Type' column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center gap-1.5">
            <KeenIcon
              icon={info.row.original.eventType.icon.name}
              className={`text-lg ${info.row.original.eventType.icon.variant}`}
            />
            <span className="leading-none font-semibold text-gray-700">
              {info.row.original.eventType.label}
            </span>
          </div>
        ),
        meta: {
          headerTitle: 'Event Type',
          headerClassName: 'min-w-[200px]',
        },
      },
      {
        accessorFn: (row) => row.actionTaken,
        id: 'actionTaken',
        header: ({ column }) => <DataGridColumnHeader title='Action Taken' column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'Action Taken',
          headerClassName: 'min-w-[200px]',
        },
      },
      {
        accessorFn: (row) => row.sourceIp,
        id: 'sourceIp',
        header: ({ column }) => <DataGridColumnHeader title='Source IP' column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'Source IP',
          headerClassName: 'min-w-[130px]',
        },
      },
      {
        accessorFn: (row) => row.destinationIp,
        id: 'destinationIp',
        header: ({ column }) => <DataGridColumnHeader title='Destination IP' column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'Destination IP',
          headerClassName: 'min-w-[130px]',
        },
      },
      {
        accessorFn: (row) => row.severity,
        id: 'severity',
        header: ({ column }) => <DataGridColumnHeader title='Severity' column={column} />,
        enableSorting: true,
        cell: (info) => (
          <span className={`badge badge-sm badge-outline ${info.row.original.severity.variant}`}>
            {info.row.original.severity.label}
          </span>
        ),
        meta: {
          headerClassName: 'min-w-[110px]',
        },
      },
      {
        id: 'click',
        header: () => '',
        enableSorting: false,
        cell: () => (
          <button 
            className="btn btn-icon btn-light btn-clear btn-sm" 
          >
            <KeenIcon icon="notepad" />
          </button>
        ),
        meta: {
          headerClassName: 'w-[60px]',
        },
      },
    ],
    []
  );

  const data: ISecurityLogData[] = useMemo(() => SecurityLogData, []);

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
      <div className="card-header flex-wrap px-5 py-4 border-b-0">
        <h3 className="card-title">Security Log</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <DataGridColumnVisibility table={table}/>
          <label className="switch switch-sm">
            <input name="check" type="checkbox" value="1" defaultChecked className="order-2" readOnly />
            <span className="switch-label order-1">
              Push Alerts
            </span>
          </label>
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
      sorting={[{ id: 'timestamp', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { SecurityLog };
