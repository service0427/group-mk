/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from 'react';import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { toAbsoluteUrl } from '@/utils';
import { Column, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { DataGrid, DataGridColumnHeader, DataGridColumnVisibility, DataGridRowSelect, DataGridRowSelectAll, KeenIcon, useDataGrid, Menu, MenuItem, MenuToggle } from '@/components';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { DropdownCrudItem1 } from '@/partials/dropdowns/general';
import { InvitesData, IInvitesData } from '.';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const Invites = () => {
  const { isRTL } = useLanguage();
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

  const columns = useMemo<ColumnDef<IInvitesData>[]>(
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
        accessorFn: (row) => row.member,
        id: 'member',
        header: ({ column }) => <DataGridColumnHeader title='Member' filter={<ColumnInputFilter column={column} />} column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <div className="flex items-center gap-2.5">
              <div>
                <img
                  src={toAbsoluteUrl(`/media/avatars/${info.row.original.member.avatar}`)}
                  className="h-9 rounded-full"
                  alt=""
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <Link
                  className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
                  to="/network/user-cards/mini-cards"
                >
                  {info.row.original.member.name}
                </Link>
                <span className="text-2sm text-gray-700 font-normal">
                  {info.row.original.member.tasks} tasks
                </span>
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.location,
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title='Location' column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <div className="flex items-center gap-1.5">
              <img
                src={toAbsoluteUrl(`/media/flags/${info.row.original.location.flag}`)}
                className="h-4 rounded-full"
                alt=""
              />
              <span className="leading-none text-gray-800 font-normal">
                {info.row.original.location.name}
              </span>
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.status,
        id: 'status',
        enableSorting: true,
        header: ({ column }) => <DataGridColumnHeader title='Status' column={column} />,
        cell: (info) => {
          return (
            <span className={`badge badge-xs badge-outline ${info.row.original.status.variant} items-center`}>
              <span className={info.row.original.status.variant}></span>
              {info.row.original.status.label}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[103px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.recentlyActivity,
        id: 'recentlyActivity',
        header: ({ column }) => <DataGridColumnHeader title='Recent activity' column={column} />,
        enableSorting: true,
        cell: (info) => info.getValue(),
        meta: {
          headerTitle: 'Recent activity',
          headerClassName: 'min-w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'click',
        header: () => '',
        enableSorting: false,
        cell: () => (
          <Menu className="items-stretch">
            <MenuItem
              toggle="dropdown"
              trigger="click"
              dropdownProps={{
                placement: isRTL() ? 'bottom-start' : 'bottom-end',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                    }
                  }
                ]
              }}
            >
              <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                <KeenIcon icon="dots-vertical" />
              </MenuToggle>
              {DropdownCrudItem1()}
            </MenuItem>
          </Menu>
        ),
        meta: {
          headerClassName: 'w-[60px]',
        },
      },
    ],
    [isRTL]
  );

  // Memoize the team data
  const data: IInvitesData[] = useMemo(() => InvitesData, []);

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
        team.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.location.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="card-header flex-wrap px-5 py-5 border-b-0 gap-2">
        <h3 className="card-title">Invites</h3>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 start-0 -translate-y-1/2 ms-3"
            />
            <input
              type="text"
              className="input input-sm ps-8"
              placeholder="Search Members"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Update search term
            />
          </div>
          <DataGridColumnVisibility table={table}/>
          <label className="switch switch-sm">
            <input name="check" type="checkbox" value="1" className="order-2" readOnly />
            <span className="switch-label order-1">Active Users</span>
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
      sorting={[{ id: 'member', desc: false }]} 
      toolbar={<Toolbar />}
      layout={{ card: true }}
    />
  );
};

export { Invites };
