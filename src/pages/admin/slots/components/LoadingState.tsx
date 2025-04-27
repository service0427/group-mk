import React from 'react';

// 데스크톱용과 모바일용 로딩 상태를 함께 표시하는 컴포넌트
const LoadingState: React.FC = () => {
  return (
    <>
      {/* 데스크톱용 로딩 */}
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
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                    <div className="text-gray-600 font-medium">데이터를 불러오는 중입니다...</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일용 로딩 */}
      <div className="block md:hidden px-4">
        <div className="p-5 bg-white rounded shadow-sm text-center">
          <div className="d-flex flex-column align-items-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="text-gray-600 font-medium">데이터를 불러오는 중입니다...</div>
            <p className="text-gray-500 mt-2 small">잠시만 기다려 주세요.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoadingState;
