'use client';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
  getFacetedRowModel,
  getFacetedUniqueValues,
  RowSelectionState,
  OnChangeFn,
  Table,
  SortingState
} from '@tanstack/react-table';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DataGridInner } from './DataGridInner';
import { TDataGridProps, TDataGridRequestParams } from './DataGrid';
import { deepMerge, debounce } from '@/lib/helpers';

export interface IDataGridContextProps<TData extends object> {
  props: TDataGridProps<TData>;
  table: Table<TData>;
  totalRows: number;
  loading: boolean;
  setLoading: (state: boolean) => void;
  reload: () => void
}

const DataGridContext = createContext<IDataGridContextProps<any> | undefined>(undefined);

export const useDataGrid = () => {
  const context = useContext(DataGridContext);
  if (!context) {
    throw new Error('useDataGrid must be used within a DataGridProvider');
  }
  return context;
};

export const DataGridProvider = <TData extends object>(props: TDataGridProps<TData>) => {
  const defaultValues: Partial<TDataGridProps<TData>> = {
    messages: {
      empty: 'No data available',
      loading: 'Loading...'
    },
    layout: {
      cellSpacing: 'md',
      cellBorder: true,
      card: false
    },
    pagination: {
      info: '{from} - {to} of {count}',
      sizes: [5, 10, 25, 50, 100],
      sizesLabel: 'Show',
      sizesDescription: 'per page',
      size: 5,
      page: 0,
      moreLimit: 5,
      more: false
    },
    rowSelection: false,
    serverSide: false
  };

  const mergedProps = deepMerge(defaultValues, props);

  const [data, setData] = useState<TData[]>(mergedProps.data || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalRows, setTotalRows] = useState<number>(mergedProps.data ? mergedProps.data.length : 0);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: props.pagination?.page ?? 0,
    pageSize: props.pagination?.size ?? 5
  });
  const [rowSelection, setRowSelection] = useState(mergedProps.rowSelection);
  const [sorting, setSorting] = useState<SortingState>(mergedProps.sorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const fetchServerSideData = useCallback(async () => {
    if (loading || !mergedProps.onFetchData) return;

    setLoading(true);

    try {
      const requestParams: TDataGridRequestParams = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        columnFilters
      };

      const { data, totalCount } = await mergedProps.onFetchData(requestParams);

      setData(data || []);
      setTotalRows(totalCount || 0);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, pagination, sorting, columnFilters, mergedProps.onFetchData]);

  const debouncedFetchData = debounce(fetchServerSideData, 100);

  const loadData = () => {
    if (mergedProps.serverSide) {
      debouncedFetchData();
    } else {
      setLoading(true); // Show loading bar for local data
      setData(mergedProps.data || []);
      setTotalRows(mergedProps.data ? mergedProps.data.length : 0);
      setLoading(false); // Hide loading bar after data is set
    }
  }

  // Trigger debounced fetch for server-side data; load local data if serverSide is false
  useEffect(() => {
    loadData();
  }, [pagination, sorting, columnFilters, mergedProps.data, mergedProps.serverSide]);

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updaterOrValue) => {
    setRowSelection((prev: RowSelectionState) =>
      typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
    );

    if (mergedProps.onRowSelectionChange) {
      const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue;
      mergedProps.onRowSelectionChange(newSelection, table);
    }
  };

  const table = useReactTable({
    data,
    columns: mergedProps.columns,
    pageCount: mergedProps.serverSide ? Math.ceil(totalRows / pagination.pageSize) : undefined,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination
    },
    getRowId: mergedProps.getRowId || ((row, index) => String(index)),
    enableRowSelection: mergedProps.rowSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: (newSorting) => !loading && setSorting(newSorting),
    onColumnFiltersChange: (newFilters) => !loading && setColumnFilters(newFilters),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (newPagination) => !loading && setPagination(newPagination),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: mergedProps.serverSide,
    manualSorting: mergedProps.serverSide,
    manualFiltering: mergedProps.serverSide
  });

  return (
    <DataGridContext.Provider
      value={{
        props: mergedProps,
        table,
        totalRows,
        loading,
        setLoading,
        reload: loadData
      }}
    >
      <DataGridInner />
    </DataGridContext.Provider>
  );
};
