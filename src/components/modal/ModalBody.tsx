import { forwardRef, ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface IModalBodyProps {
  className?: string;
  children: ReactNode;
  tabIndex?: number;
  style?: CSSProperties; // Accept inline styles as a prop
}

// Forwarding ref to ensure this component can hold a ref
const ModalBody = forwardRef<HTMLDivElement, IModalBodyProps>(
  ({ className, children, style, tabIndex = -1 }, ref) => {
    return (
      <div ref={ref} tabIndex={tabIndex} className={cn('modal-body bg-background', className)} style={style}>
        {children}
      </div>
    );
  }
);

export { ModalBody };