import React from 'react';
import { KeenIcon } from '@/components/keenicons';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '알림 삭제',
  message = '이 알림을 정말 삭제하시겠습니까?'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-sm mx-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-danger">{title}</h3>
          <button 
            className="text-muted-foreground hover:text-card-foreground p-1 rounded-full"
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
        </div>
        
        {/* 본문 */}
        <div className="p-5 bg-background">
          <div className="mb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <KeenIcon icon="trash" className="text-xl text-danger" />
              </div>
            </div>
            <p className="text-muted-foreground">{message}</p>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button 
              className="btn btn-sm btn-danger w-full text-center justify-center"
              onClick={() => {
                onConfirm();
              }}
            >
              <KeenIcon icon="trash" className="me-1" />
              삭제
            </button>
            <button 
              className="btn btn-sm btn-light-secondary w-full text-center justify-center"
              onClick={onClose}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;