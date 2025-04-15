import { forwardRef, ReactNode } from 'react';

interface IModalHeaderProps {
  className?: string;
  children: ReactNode;
}

// Forwarding ref to ensure this component can hold a ref
const ModalHeader = forwardRef<HTMLDivElement, IModalHeaderProps>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={`modal-header ${className}`}>
        {children}
      </div>
    );
  }
);

export { ModalHeader };
