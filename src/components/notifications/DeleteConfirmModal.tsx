import React from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium text-red-600">{title}</h3>
          <button 
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full"
            onClick={onClose}
          >
            <i className="ki-cross text-lg"></i>
          </button>
        </div>
        
        {/* 본문 */}
        <div className="p-5">
          <div className="mb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <i className="ki-trash text-xl text-red-600"></i>
              </div>
            </div>
            <p className="text-gray-600">{message}</p>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button 
              className="btn btn-sm bg-red-600 hover:bg-red-700 text-white w-full text-center justify-center"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              삭제
            </button>
            <button 
              className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white w-full text-center justify-center"
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