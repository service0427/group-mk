import { HTMLAttributes, ReactNode } from 'react';
import { ChevronsUpDown, ArrowUp, ArrowDown, EyeOff, Check } from 'lucide-react';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';

interface IDataGridColumnHeader<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title?: string;
  filter?: ReactNode;
}

export function DataGridColumnHeader<TData, TValue>({
  column,
  title = '',
  className,
  filter
}: IDataGridColumnHeader<TData, TValue>) {
  if (!filter && !column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  if (!filter && !column.getCanHide() && column.getCanSort()) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn('-ms-3 h-8 data-[state=open]:bg-accent !ring-0 !ring-offset-0', className)}
        onClick={() => {
          // Determine the current sorting state
          const isSorted = column.getIsSorted();
          if (isSorted === 'asc') {
            column.toggleSorting(true); // Switch to desc
          } else if (isSorted === 'desc') {
            column.clearSorting(); // Clear to unsorted
          } else {
            column.toggleSorting(false); // Switch to asc
          }
        }}
      >
        <span>{title}</span>
        {column.getIsSorted() === 'desc' ? (
          <ArrowDown className="!size-[0.825rem]" />
        ) : column.getIsSorted() === 'asc' ? (
          <ArrowUp className="!size-[0.825rem]" />
        ) : (
          <ChevronsUpDown className="!size-[0.825rem]" />
        )}
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              '-ms-3 h-8 data-[state=open]:bg-accent !ring-0 !ring-offset-0',
              className
            )}
          >
            <span className="text-sm">{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className="!size-[0.825rem]" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className="!size-[0.825rem]" />
            ) : (
              <ChevronsUpDown className="!size-[0.825rem]" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {filter && (
            <>
              <DropdownMenuLabel>{filter}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="!size-[0.825rem] text-muted-foreground/90" />
                <span className="grow">Asc</span>
                {column.getIsSorted() === 'asc' && (
                  <Check className="size-4 text-muted-foreground/90" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="!size-[0.825rem] text-muted-foreground/90" />
                <span className="grow">Desc</span>
                {column.getIsSorted() === 'desc' && (
                  <Check className="size-4 text-muted-foreground/90" />
                )}
              </DropdownMenuItem>
            </>
          )}

          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="!size-[0.825rem] text-muted-foreground/90" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
