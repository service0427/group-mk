import React from 'react';
import ReactDOM from 'react-dom';

interface GuaranteeRequestRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignName?: string;
  isLoading?: boolean;
}

const GuaranteeRequestRejectModal: React.FC<GuaranteeRequestRejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={onClose} />
      
      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              견적 요청 반려
            </h3>
          </div>
          
          {/* 바디 */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  {campaignName ? (
                    <>
                      <span className="font-semibold">{campaignName}</span> 캠페인의 견적 요청을 반려하시겠습니까?
                    </>
                  ) : (
                    '이 견적 요청을 반려하시겠습니까?'
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  반려된 요청은 되돌릴 수 없으며, 사용자는 새로운 견적 요청을 해야 합니다.
                </p>
              </div>
            </div>
          </div>
          
          {/* 푸터 */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end gap-3">
            <button
              className="btn btn-danger btn-sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  반려 중...
                </span>
              ) : (
                '반려'
              )}
            </button>
            <button
              className="btn btn-light btn-sm"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default GuaranteeRequestRejectModal;