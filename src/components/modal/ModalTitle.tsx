import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IModalTitleProps {
  className?: string;
  children: ReactNode;
}

// Forwarding ref to ensure this component can hold a ref
const ModalTitle = forwardRef<HTMLDivElement, IModalTitleProps>(({ className, children }, ref) => {
  return (
    <h3 ref={ref} className={cn('modal-title text-foreground', className)}>
      {children}
    </h3>
  );
});

export { ModalTitle };