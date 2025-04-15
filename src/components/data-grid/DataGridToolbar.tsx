import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface IDataGridToolbarProps {
  children: ReactNode;
  className?: string;
}

const DataGridToolbar = ({ children, className }: IDataGridToolbarProps) => {
  return (
    <div data-toolbar className={cn('flex items-center gap-2 justify-between', className)}>
      {children}
    </div>
  );
};

export { DataGridToolbar };
