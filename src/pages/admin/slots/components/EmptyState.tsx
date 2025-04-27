import React from 'react';

interface EmptyStateProps {
  onRefresh: () => void;
}

// 데이터가 없는 상태를 표시하는 컴포넌트
const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh }) => {
  return (
    <>
      {/* 데스크톱용 테이블 */}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <div className="text-gray-500 text-lg font-semibold">검색 결과가 없습니다</div>
                    <p className="text-gray-400 mt-2">현재 조건에 맞는 신청된 슬롯이 없습니다.</p>
                    <p className="text-gray-400">다른 검색 조건으로 시도해보세요.</p>
                    <button 
                      className="btn btn-sm btn-primary mt-4"
                      onClick={onRefresh}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      다시 검색하기
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일용 카드 */}
      <div className="block md:hidden px-4">
        <div className="p-5 bg-white rounded shadow-sm text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-3 mx-auto">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <div className="text-gray-500 text-lg font-semibold mb-2">검색 결과가 없습니다</div>
          <p className="text-gray-400 mb-2">현재 조건에 맞는 신청된 슬롯이 없습니다.</p>
          <p className="text-gray-400">다른 검색 조건으로 시도해보세요.</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={onRefresh}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            다시 검색하기
          </button>
        </div>
      </div>
    </>
  );
};

export default EmptyState;
