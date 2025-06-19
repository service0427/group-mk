import React from 'react';
import ReactDOM from 'react-dom';

interface GuaranteeRequestCancelRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignName?: string;
  isLoading?: boolean;
}

const GuaranteeRequestCancelRejectModal: React.FC<GuaranteeRequestCancelRejectModalProps> = ({
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
              거절 취소 확인
            </h3>
          </div>
          
          {/* 바디 */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {campaignName ? (
                    <>
                      <span className="font-semibold">{campaignName}</span> 캠페인의 거절을 취소하시겠습니까?
                    </>
                  ) : (
                    '이 견적 거절을 취소하시겠습니까?'
                  )}
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    거절을 취소하면 협상 상태로 돌아갑니다.
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    사용자와 다시 협상을 진행할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 푸터 */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end gap-3">
            <button
              className="btn btn-primary btn-sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  처리 중...
                </span>
              ) : (
                '거절 취소'
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

export default GuaranteeRequestCancelRejectModal;