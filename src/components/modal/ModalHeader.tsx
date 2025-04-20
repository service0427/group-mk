import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IModalHeaderProps {
  className?: string;
  children: ReactNode;
}

// Forwarding ref to ensure this component can hold a ref
const ModalHeader = forwardRef<HTMLDivElement, IModalHeaderProps>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={cn('modal-header border-border', className)}>
        {children}
      </div>
    );
  }
);

export { ModalHeader };