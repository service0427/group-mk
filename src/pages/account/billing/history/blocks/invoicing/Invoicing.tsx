/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, useDataGrid, KeenIcon } from '@/components';
import { InvoicingData, IInvoicingData } from './';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Invoicing = () => {
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

  const columns = useMemo<ColumnDef<IInvoicingData>[]>(
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
        accessorFn: (row) => row.invoice,
        id: 'invoice',
        header: ({ column }) => <DataGridColumnHeader title="Member" filter={<ColumnInputFilter column={column}/>} column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.invoice;
        },
        meta: {
          headerClassName: 'min-w-[200px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },
      {
        accessorFn: (row) => row.label,
        id: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column}/>,
        enableSorting: true,
        cell: (info) => {                    
          return (
            <div className={`badge badge-sm badge-outline ${info.row.original.color}`}>
              {info.row.original.label}
            </div>
          );
        },
        meta: {
          headerClassName: 'w-[170px]',
        }
      },   
      {
        accessorFn: (row) => row.date,
        id: 'date',
        header: ({ column }) => <DataGridColumnHeader title="Date" column={column}/>,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.date;
        },
        meta: {
          headerClassName: 'min-w-[170px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },
      {
        accessorFn: (row) => row.dueDate,
        id: 'dueDate',
        header: ({ column }) => <DataGridColumnHeader title="Due Date" column={column}/>,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.dueDate;
        },
        meta: {
          headerClassName: 'min-w-[170px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },    
      {
        accessorFn: (row) => row.amount,
        id: 'amount',
        header: ({ column }) => <DataGridColumnHeader title="Amount" column={column}/>,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.amount;
        },
        meta: {
          headerClassName: 'w-[170px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },
      {
        id: 'actions',
        header: () => '',
        enableSorting: false,
        cell: () => {                    
          return (
            <button className="btn btn-link">Download</button>
          );
        },
        meta: {
          headerClassName: 'w-[100px]'
        }
      },      
    ],
    []
  );

  const data: IInvoicingData[] = useMemo(() => InvoicingData, []);

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
    const isFiltered = table.getState().columnFilters.length > 0

    return (
      <div className="card-header border-b-0 px-5 flex-wrap">
        <h3 className="card-title">Billing and Invoicing</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="btn btn-light btn-sm">
            <KeenIcon icon="exit-down" />
            Download PDF
          </button>
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
      pagination={{ size: 5 }}
      sorting={[{ id: 'invoice', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { Invoicing };
