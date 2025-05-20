/* eslint-disable @typescript-eslint/no-unused-vars */
import { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
   
  interface ColumnMeta<TData extends RowData, TValue> {
    headerTitle?: string;
    headerClassName?: string;
    cellClassName?: string;
  }
}
