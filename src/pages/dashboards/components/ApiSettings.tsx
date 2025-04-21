import React from 'react';

interface ApiSettingsProps {
  endpoints?: {
    path: string;
    developer: string;
    operator: string;
    distributor: string;
    agency: string;
    advertiser: string;
  }[];
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({ endpoints }) => {
  const defaultEndpoints = [
    {
      path: '/api/users/*',
      developer: '전체',
      operator: '읽기/수정',
      distributor: '읽기',
      agency: '-',
      advertiser: '-',
    },
    {
      path: '/api/products/*',
      developer: '전체',
      operator: '전체',
      distributor: '생성/수정',
      agency: '읽기',
      advertiser: '읽기',
    },
    {
      path: '/api/transactions/*',
      developer: '전체',
      operator: '전체',
      distributor: '부분만',
      agency: '부분만',
      advertiser: '부분만',
    },
  ];

  const apiEndpoints = endpoints || defaultEndpoints;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title align-items-start flex-column">
          <span className="card-label fw-bold fs-3 mb-1">API 엔드포인트 및 역할별 권한 설정</span>
        </h3>
      </div>
      <div className="card-body py-3">
        <div className="table-responsive">
          <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
            <thead>
              <tr className="fw-bold text-gray-600 bg-light">
                <th className="min-w-150px ps-4 text-start">엔드포인트</th>
                <th className="min-w-100px text-center">개발자</th>
                <th className="min-w-100px text-center">운영자</th>
                <th className="min-w-100px text-center">총판</th>
                <th className="min-w-100px text-center">대행사</th>
                <th className="min-w-100px text-center">광고주</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td className="ps-4 text-start">
                    <span className="fw-bold d-block fs-6">
                      {endpoint.path}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="d-block fs-7">
                      {endpoint.developer}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="d-block fs-7">
                      {endpoint.operator}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="d-block fs-7">
                      {endpoint.distributor}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="d-block fs-7">
                      {endpoint.agency}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="d-block fs-7">
                      {endpoint.advertiser}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer">
        <div className="d-flex justify-content-end">
          <button className="btn btn-sm btn-primary me-2">
            <i className="fas fa-plus"></i> API 엔드포인트 추가
          </button>
          <button className="btn btn-sm btn-light">
            <i className="fas fa-sync"></i> 권한 설정 새로 고침
          </button>
        </div>
      </div>
    </div>
  );
};