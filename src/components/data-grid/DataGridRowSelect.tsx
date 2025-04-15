import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Row } from '@tanstack/react-table';

export interface IDataGridRowSelectProps<TData> {
  row: Row<TData>;
}

const DataGridRowSelect = <TData,>({ row }: IDataGridRowSelectProps<TData>) => {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className="align-[inherit]"
    />
  );
};

export { DataGridRowSelect };
