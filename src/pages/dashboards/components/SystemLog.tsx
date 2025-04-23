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
}

export const SystemLog: React.FC<SystemLogProps> = ({
  logs = [],
  maxItems = 5,
}) => {
  const typeColors = {
    error: 'danger',
    info: 'primary',
    warning: 'warning',
    success: 'success',
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
    <div className="card">
      <div className="card-header border-0 pt-5 pb-0">
        <h3 className="card-title align-items-start flex-column">
          <span className="card-label fw-bold">최근 시스템 로그</span>
        </h3>
        <div className="card-toolbar">
          <button className="btn btn-sm btn-light">
            모든 로그 보기
          </button>
        </div>
      </div>
      <div className="card-body py-3">
        <div className="table-responsive">
          <table className="table table-row-gray-300 align-middle gs-0 gy-4">
            <thead>
              <tr className="fw-bold text-gray-600 bg-light">
                <th className="w-250px ps-4 text-start" style={{ maxWidth: '250px' }}>메시지</th>
                <th className="w-90px text-center pe-4" style={{ maxWidth: '90px' }}>시간</th>
              </tr>
            </thead>
            <tbody>
              {limitedLogs.map((log) => (
                <tr key={log.id}>
                  <td className="ps-4 text-start" style={{ maxWidth: '250px', overflow: 'hidden' }}>
                    <span className="d-block fs-6 text-truncate" title={log.message}>
                      {log.message}
                    </span>
                  </td>
                  <td className="text-center pe-4" style={{ maxWidth: '90px', overflow: 'hidden' }}>
                    <span className="fw-semibold d-block fs-7 text-truncate" title={log.time}>
                      {log.time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};