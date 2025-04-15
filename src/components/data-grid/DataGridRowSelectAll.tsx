import React from 'react';
import { useDataGrid } from '.';
import { Checkbox } from '@/components/ui/checkbox';

const DataGridRowSelectAll = () => {
  const { table } = useDataGrid();

  return (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
      className="align-[inherit]"
    />
  );
};

export { DataGridRowSelectAll };
