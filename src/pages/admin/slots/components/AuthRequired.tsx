import React from 'react';

const AuthRequired: React.FC = () => {
  return (
    <div className="table-responsive" style={{ width: '100%', padding: '0 1.25rem' }}>
      <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3" style={{ width: '100%' }}>
        <thead>
          <tr className="fw-bold text-muted">
            <th>알림</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center py-10">
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info mb-2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div className="text-gray-700 text-lg font-semibold">로그인 정보를 확인하는 중입니다</div>
                <p className="text-gray-500 mt-2">잠시 후에 다시 시도하거나, 페이지를 새로고침 해주세요.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AuthRequired;
