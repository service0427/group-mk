import React from 'react';
import { KeenIcon } from '@/components';

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

  // 권한 별 배지 스타일
  const getBadgeStyle = (permission: string) => {
    if (permission === '전체') {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    } else if (permission === '읽기/수정' || permission === '생성/수정') {
      return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    } else if (permission === '읽기') {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
    } else if (permission === '부분만') {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
    } else {
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border dark:border-gray-700 overflow-hidden">
      <div className="p-5 pb-4 flex justify-between items-center bg-card border-b border-border">
        <h3 className="text-base font-medium text-card-foreground">
          API 엔드포인트 및 역할별 권한 설정
        </h3>
      </div>
      
      <div className="bg-card">
        {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-muted dark:bg-gray-800/60">
                <th className="py-3 px-3 font-medium text-start min-w-[150px]">엔드포인트</th>
                <th className="py-3 px-3 font-medium text-center min-w-[100px]">개발자</th>
                <th className="py-3 px-3 font-medium text-center min-w-[100px]">운영자</th>
                <th className="py-3 px-3 font-medium text-center min-w-[100px]">총판</th>
                <th className="py-3 px-3 font-medium text-center min-w-[100px]">대행사</th>
                <th className="py-3 px-3 font-medium text-center min-w-[100px]">광고주</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((endpoint, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/40">
                  <td className="py-3 px-3 text-start font-medium text-gray-900 dark:text-white">
                    {endpoint.path}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.developer)}`}>
                        {endpoint.developer}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.operator)}`}>
                        {endpoint.operator}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.distributor)}`}>
                        {endpoint.distributor}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.agency)}`}>
                        {endpoint.agency}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.advertiser)}`}>
                        {endpoint.advertiser}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 모바일용 카드 레이아웃 (md 미만 화면에서만 표시) */}
        <div className="block md:hidden">
          <div className="divide-y divide-border">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="p-4 hover:bg-muted/40">
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground">엔드포인트</div>
                  <div className="mt-1 font-medium text-gray-900 dark:text-white">{endpoint.path}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground">개발자</div>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.developer)}`}>
                        {endpoint.developer}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground">운영자</div>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.operator)}`}>
                        {endpoint.operator}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground">총판</div>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.distributor)}`}>
                        {endpoint.distributor}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground">대행사</div>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.agency)}`}>
                        {endpoint.agency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground">광고주</div>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(endpoint.advertiser)}`}>
                        {endpoint.advertiser}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-card border-t border-border">
        <div className="flex justify-end gap-2">
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-9 px-4 py-2">
            <KeenIcon icon="add-circle" className="me-1 h-4 w-4" /> API 엔드포인트 추가
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-muted h-9 px-4 py-2">
            <KeenIcon icon="reload" className="me-1 h-4 w-4" /> 권한 설정 새로 고침
          </button>
        </div>
      </div>
    </div>
  );
};