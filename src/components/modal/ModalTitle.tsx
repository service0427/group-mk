import { forwardRef, ReactNode } from 'react';

interface IModalTitleProps {
  className?: string;
  children: ReactNode;
}

// Forwarding ref to ensure this component can hold a ref
const ModalTitle = forwardRef<HTMLDivElement, IModalTitleProps>(({ className, children }, ref) => {
  return (
    <h3 ref={ref} className={`modal-title ${className}`}>
      {children}
    </h3>
  );
});

export { ModalTitle };
