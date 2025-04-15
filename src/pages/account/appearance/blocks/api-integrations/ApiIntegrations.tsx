/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { CrudCardFooter } from '@/partials/crud';
import { ApiIntegrationsData, IApiIntegrationsData } from '.';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const ApiIntegrations = () => {
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

  const columns = useMemo<ColumnDef<IApiIntegrationsData>[]>(
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
        accessorFn: (row) => row.integration,
        id: 'integration',
        header: ({ column }) => <DataGridColumnHeader title="Integration" filter={<ColumnInputFilter column={column} />} column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.integration;
        },
        meta: {
          headerClassName: 'min-w-[206px]'
        }
      },
      {
        accessorFn: (row) => row.apiKey,
        id: 'apiKey',
        header: ({ column }) => <DataGridColumnHeader title="API Key" column={column} />,
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center text-gray-800 font-normal">
            {info.row.original.apiKey}
            <a
              href="#"
              className="btn btn-sm btn-icon btn-clear text-gray-500 hover:text-primary-active"
            >
              <KeenIcon icon="copy" />
            </a>
          </div>
        ),
        meta: {
          headerTitle: 'API Key',
          headerClassName: 'min-w-[224px]'
        }
      },   
      {
        accessorFn: (row) => row.dailyCalls,
        id: 'dailyCalls',
        header: ({ column }) => <DataGridColumnHeader title="Daily Calls" column={column} />,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.dailyCalls;
        },
        meta: {
          headerTitle: 'Daily Calls',
          headerClassName: 'min-w-[122px]'
        }
      },
      {
        accessorFn: (row) => row.actions,
        id: 'actions',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: true,
        cell: (info) => {                    
          return info.row.original.actions;
        },
        meta: {
          headerClassName: 'min-w-[98px]'
        }
      },
      {
        id: 'actions',
        header: () => '',
        enableSorting: false,
        cell: () => {                    
          return (
            <button 
              className="btn btn-sm btn-icon btn-icon-lg btn-clear btn-light" 
            >
              <KeenIcon icon="notepad-edit" />
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

  const data: IApiIntegrationsData[] = useMemo(() => ApiIntegrationsData, []);

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
      <div className="card-header px-5 py-5 border-b-0">
        <h3 className="card-title">API Integrations</h3>

        <div className="flex items-center gap-2.5">
          <div className="flex gap-7.5">
            <label className="switch switch-sm">
              <input name="check" type="checkbox" value="1" className="order-2" readOnly />
              <span className="switch-label order-1">
                Pause all
              </span>
            </label>
            <a href="#" className="btn btn-sm btn-primary">Add New</a>
          </div>
          <DataGridColumnVisibility table={table}/>
        </div>
      </div>
    );
  };

  return (
    <>
      <DataGrid 
        columns={columns} 
        data={data} 
        rowSelection={true} 
        onRowSelectionChange={handleRowSelection}
        pagination={{ size: 10 }}
        sorting={[{ id: 'integration', desc: false }]} 
        toolbar={<Toolbar />}
        layout={{ card: true }}
      />

      <CrudCardFooter />
    </>
  );
};

export { ApiIntegrations };
