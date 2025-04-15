import { forwardRef, ReactNode, CSSProperties } from 'react';

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
      <div ref={ref} tabIndex={tabIndex} className={`modal-body ${className}`} style={style}>
        {children}
      </div>
    );
  }
);

export { ModalBody };
