import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IModalContentProps {
  className?: string;
  children: ReactNode;
  tabIndex?: number;
}

// Forwarding ref to ensure this component can hold a ref
const ModalContent = forwardRef<HTMLDivElement, IModalContentProps>(
  ({ className, children, tabIndex = -1 }, ref) => {
    return (
      <div ref={ref} tabIndex={tabIndex} className={cn('modal-content bg-background', className)}>
        {children}
      </div>
    );
  }
);

export { ModalContent };