import { forwardRef } from 'react';
import { Modal as MuiModal, ModalProps as BaseModalProps } from '@mui/base/Modal';
import { ModalBackdrop } from '@/components';
import clsx from 'clsx';

interface IModalProps extends BaseModalProps {
  zIndex?: number;
  className?: string; // For content-specific Tailwind stylesx
}

// Forwarding ref to ensure this component can hold a ref
const Modal = forwardRef<HTMLDivElement, IModalProps>(
  ({ open, onClose, children, className, zIndex = 100, ...props }, ref) => {
    return (
      <MuiModal
        ref={ref}
        open={open}
        onClose={onClose}
        style={{
          zIndex: `${zIndex}`,
          opacity: open ? 1 : 0,
          display: open ? 'block' : 'none'
        }}
        className={clsx('modal', className)}
        {...props} // Spread any additional props
        slots={{ backdrop: ModalBackdrop }} // Assign custom backdrop
      >
        {children}
      </MuiModal>
    );
  }
);

export { Modal };
