/* eslint-disable prettier/prettier */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid, DataGridColumnVisibility } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { BackupData, IBackupData } from '.';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Backup= () => {
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
  
  const columns = useMemo<ColumnDef<IBackupData>[]>(
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
        accessorFn: (row) => row.when,
        id: 'when',
        header: ({ column }) => <DataGridColumnHeader title="When" filter={<ColumnInputFilter column={column}/>} column={column} />,
        enableSorting: true,
        cell: ({ row }) => { 
          return (
            <div className="flex items-center gap-4">

              <div className="flex flex-col gap-0.5">
                <span className="leading-none font-medium text-sm text-gray-900">
                  {row.original.when.duration}
                </span>
                <span className="text-2sm text-gray-700 font-normal">
                  {row.original.when.datetime}
                </span>
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[260px]',
          cellClassName: 'text-gray-800 font-normal',
        }
      },
      {
        accessorFn: (row) => row.details,
        id: 'details',
        header: ({ column }) => <DataGridColumnHeader title="Details" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <div>
              <span className="leading-none font-medium text-sm text-gray-900">
                {info.row.original.details.title}
              </span>
              <span className="flex items-center gap-2 text-xs text-gray-600 font-normal">
                <span className="flex items-center gap-1">
                  <KeenIcon icon="files" className="text-sm text-gray-500" />
                  <p>{info.row.original.details.pages} pages</p>
                </span>
                <span className="border-e border-e-gray-300 h-4"></span>
                <span className="flex items-center gap-1">
                  <KeenIcon icon="picture" className="text-sm text-gray-500" />
                  <p>{info.row.original.details.media} media</p>
                </span>
              </span>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[260px]',
        }
      },
  
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: () => {                    
          return (
            <Link to="#" className="btn btn-sm btn-clear btn-light">
              Preview
            </Link>
          );
        },
        meta: {
          headerClassName: 'w-[70px]'
        }
      },      
      {
        id: 'trash',
        header: () => '',
        enableSorting: false,
        cell: () => {                    
          return (
            <Link to="#" className="btn btn-sm btn-light btn-outline">
							Restore
						</Link>
          );
        },
        meta: {
          headerClassName: 'w-[70px]'
        }
      },      
    ],
    []
  );

  const data: IBackupData[] = useMemo(() => BackupData, []);

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
      <div className="card-header px-5 py-5 border-b-0 flex-wrap">
        <h3 className="card-title">Backups</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <DataGridColumnVisibility table={table}/>
          <label className="switch switch-sm">
            <span className="switch-label">
              Cloud Sync
            </span>
            <input type="checkbox" value="1" name="check" defaultChecked readOnly />
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
      sorting={[{ id: 'when', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { Backup };