/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { CommonAvatars, CommonRating } from '@/partials/common';
import { TeamsData, ITeamData } from './';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Teams = () => {
  const storageFilterId = 'teams-filter';
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

  const columns = useMemo<ColumnDef<ITeamData>[]>(
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
        accessorFn: (row) => row.team.name,
        id: 'team',
        header: ({ column }) => <DataGridColumnHeader title='Team' filter={<ColumnInputFilter column={column} />} column={column} />,
        enableSorting: true,
        filterFn: (row, columnId, filterValue) => {
          const team = row.original.team; // Access the original row data
          const nameMatch = team.name?.toLowerCase().includes(filterValue.toLowerCase());
          const descriptionMatch = team.description?.toLowerCase().includes(filterValue.toLowerCase());
          
          return nameMatch || descriptionMatch;
        },
        cell: (info) => {
          return (
            <div className="flex flex-col gap-2">
              <Link
                className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
                to="#"
              >
                {info.row.original.team.name}
              </Link>
              <span className="text-2sm text-gray-700 font-normal leading-3">
                {info.row.original.team.description}
              </span>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[350px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.rating.value,
        id: 'rating',
        header: ({ column }) => <DataGridColumnHeader title='Rating' column={column} />,
        enableSorting: true,
        cell: (info) => (
          <CommonRating
            rating={info.row.original.rating.value}
            round={info.row.original.rating.round}
          />
        ),
        meta: {
          headerClassName: 'w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.lastModified,
        id: 'lastModified',
        enableSorting: true,
        header: ({ column }) => <DataGridColumnHeader title='Last Modified' column={column} />,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'Last Modified',
          headerClassName: 'w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.members,
        id: 'members',
        header: ({ column }) => <DataGridColumnHeader title='Members' column={column} />,
        enableSorting: true,
        cell: (info) => (
          <CommonAvatars
            size="size-[30px]"
            group={info.row.original.members.group}
            more={info.row.original.members.more}
          />
        ),
        meta: {
          headerClassName: 'w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button 
            className="btn btn-sm btn-icon btn-clear btn-light" 
            onClick={() => alert(`Clicked on edit for ${row.original.team}`)}
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
            onClick={() => alert(`Clicked on delete for ${row.original.team}`)}
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

  // Memoize the team data
  const data: ITeamData[] = useMemo(() => TeamsData, []);

  // Initialize search term from localStorage if available
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  // Update localStorage whenever the search term changes
  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  // Filtered data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data; // If no search term, return full data

    return data.filter(
      (team) =>
        team.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.team.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, data]);

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
        <h3 className="card-title">Teams</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-6">
            <div className="relative">
              <KeenIcon
                icon="magnifier"
                className="leading-none text-md text-gray-500 absolute top-1/2 start-0 -translate-y-1/2 ms-3"
              />
              <input
                type="text"
                placeholder="Search Teams"
                className="input input-sm ps-8"
                value={(table.getColumn('team')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('team')?.setFilterValue(event.target.value)}
              />
            </div>
          </div>
          <DataGridColumnVisibility table={table}/>
          <label className="switch switch-sm">
            <input name="check" type="checkbox" value="1" className="order-2" readOnly />
            <span className="switch-label order-1">Only Active Groups</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <DataGrid 
      columns={columns} 
      data={filteredData} 
      rowSelection={true} 
      onRowSelectionChange={handleRowSelection}
      pagination={{ size: 10 }}
      sorting={[{ id: 'team', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { Teams };
