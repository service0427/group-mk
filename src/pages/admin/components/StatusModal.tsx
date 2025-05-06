import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogBody
} from '@/components/ui/dialog';

interface StatusModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  status: 'success' | 'error' | 'info' | 'warning';
}

const StatusModal: React.FC<StatusModalProps> = ({
  open,
  onClose,
  title,
  message,
  status
}) => {
  const statusIcons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
      </svg>
    )
  };

  const statusColors = {
    success: 'bg-success/10 border-success/20',
    error: 'bg-danger/10 border-danger/20',
    info: 'bg-info/10 border-info/20',
    warning: 'bg-warning/10 border-warning/20'
  };

  const statusBtnColors = {
    success: 'btn-success',
    error: 'btn-danger',
    info: 'btn-info',
    warning: 'btn-warning'
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogBody className="p-0">
          <div className={`p-8 ${statusColors[status]} flex flex-col items-center`}>
            <div className="mb-5">
              {statusIcons[status]}
            </div>
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            <p className="text-center mb-6">{message}</p>
            <button
              onClick={onClose}
              className={`btn ${statusBtnColors[status]} min-w-[120px]`}
            >
              확인
            </button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;