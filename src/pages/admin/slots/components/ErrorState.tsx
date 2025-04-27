import React from 'react';

interface ErrorStateProps {
  error: string | null;
  onRetry: () => void;
}

// 에러 상태를 표시하는 컴포넌트
const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <>
      {/* 데스크톱용 에러 메시지 */}
      <div className="hidden md:block">
        <div className="table-responsive" style={{ width: '100%', padding: '0 1.25rem' }}>
          <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3" style={{ width: '100%' }}>
            <thead>
              <tr className="fw-bold text-muted">
                <th style={{ width: '15%' }}>사용자</th>
                <th style={{ width: '15%' }}>상품명</th>
                <th style={{ width: '10%' }}>MID</th>
                <th style={{ width: '10%' }}>제출 시간</th>
                <th style={{ width: '15%' }}>상태</th>
                <th style={{ width: '25%' }}>상세 정보</th>
                <th style={{ width: '10%' }} className="text-end">메모</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="d-flex flex-column align-items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mb-3">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div className="text-danger font-weight-bold mb-2">
                      오류가 발생했습니다
                    </div>
                    <p className="text-gray-600 mb-2">{error || '데이터를 불러오는 중 문제가 발생했습니다.'}</p>
                    <button 
                      className="btn btn-sm btn-danger mt-2"
                      onClick={onRetry}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                        <polyline points="12 8 16 12 12 16"></polyline>
                      </svg>
                      다시 시도
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일용 에러 메시지 */}
      <div className="block md:hidden px-4">
        <div className="p-4 bg-danger-light rounded shadow-sm text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger mb-3 mx-auto">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div className="text-danger font-weight-bold mb-2">
            오류가 발생했습니다
          </div>
          <p className="text-gray-600 mb-3">{error || '데이터를 불러오는 중 문제가 발생했습니다.'}</p>
          <button 
            className="btn btn-danger mt-2"
            onClick={onRetry}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              <polyline points="12 8 16 12 12 16"></polyline>
            </svg>
            다시 시도
          </button>
        </div>
      </div>
    </>
  );
};

export default ErrorState;
