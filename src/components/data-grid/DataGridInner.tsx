import { cn } from '@/lib/utils';
import { useDataGrid, DataGridLoader, DataGridTable, DataGridPagination } from '.';

const DataGridInner = () => {
  const { props, table, loading } = useDataGrid();

  return (
    <div
      className={cn(
        'grid',
        props.layout?.card &&
          `
        card
        [&>[data-container]]:border-x-0
        [&>[data-container]]:rounded-none
        [&>[data-container]>[data-table]>thead>tr>th:first-child]:px-5
        [&>[data-container]>[data-table]>tbody>tr>td:first-child]:px-5  
        [&>[data-toolbar]]:p-5
        [&>[data-pagination]]:px-5
        [&>[data-pagination]]:py-3
      `,
        props.layout?.classes?.root
      )}
    >
      {props.toolbar && props.toolbar}
      <div
        className={cn(
          'relative w-full scrollable-x-auto border rounded-md',
          props.layout?.classes?.container
        )}
        data-container
      >
        <DataGridTable />
        {loading && <DataGridLoader />}
      </div>
      {table.getRowModel().rows.length > 0 && <DataGridPagination />}
    </div>
  );
};

export { DataGridInner };
