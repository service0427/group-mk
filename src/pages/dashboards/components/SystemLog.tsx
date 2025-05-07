import React from 'react';
import { KeenIcon } from '@/components';

interface LogItem {
  id: string;
  message: string;
  time: string;
  type: 'error' | 'info' | 'warning' | 'success';
}

interface SystemLogProps {
  logs?: LogItem[];
  maxItems?: number;
  loading?: boolean;
}

export const SystemLog: React.FC<SystemLogProps> = ({
  logs = [],
  maxItems = 5,
  loading = false,
}) => {
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'info':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'success':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300';
    }
  };

  const typeIcons = {
    error: 'alert-circle',
    info: 'information-circle',
    warning: 'warning-triangle',
    success: 'check-circle',
  };

  const defaultLogs: LogItem[] = [
    {
      id: 'log-1',
      message: '사용자 인증 실패 - 잘못된 토큰',
      time: '10:42',
      type: 'error',
    },
    {
      id: 'log-2',
      message: '새 상품 등록됨 (ID: PRD-8732)',
      time: '10:30',
      type: 'info',
    },
    {
      id: 'log-3',
      message: 'API 요청량 임계치 도달 (ID: API-2)',
      time: '10:15',
      type: 'warning',
    },
    {
      id: 'log-4',
      message: '새 사용자 가입 (ID: USR-142)',
      time: '09:58',
      type: 'success',
    },
    {
      id: 'log-5',
      message: '출금 요청 승인됨 (ID: WD-215)',
      time: '09:45',
      type: 'info',
    },
  ];

  const displayLogs = logs.length > 0 ? logs : defaultLogs;
  const limitedLogs = displayLogs.slice(0, maxItems);

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border dark:border-gray-700 overflow-hidden">
      <div className="p-5 pb-4 flex justify-between items-center bg-card border-b border-border">
        <h3 className="text-base font-medium text-card-foreground">최근 시스템 로그</h3>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-muted h-9 px-4 py-2">
          모든 로그 보기
        </button>
      </div>
      
      <div className="bg-card">
        {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : limitedLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              로그가 없습니다
            </div>
          ) : (
            <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-muted dark:bg-gray-800/60">
                  <th className="py-3 px-3 font-medium text-start">유형</th>
                  <th className="py-3 px-3 font-medium text-start min-w-[250px]">메시지</th>
                  <th className="py-3 px-3 font-medium text-center min-w-[90px]">시간</th>
                </tr>
              </thead>
              <tbody>
                {limitedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(log.type)}`}>
                          <KeenIcon icon={typeIcons[log.type]} className="h-3 w-3 mr-1" />
                          {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                      <div className="truncate max-w-[250px]" title={log.message}>
                        {log.message}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-400">
                      {log.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* 모바일용 카드 레이아웃 (md 미만 화면에서만 표시) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : limitedLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              로그가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-border">
              {limitedLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/40">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeStyle(log.type)}`}>
                      <KeenIcon icon={typeIcons[log.type]} className="h-3 w-3 mr-1" />
                      {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{log.time}</span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};