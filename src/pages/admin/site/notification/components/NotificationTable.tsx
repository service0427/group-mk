import React from 'react';
import { INotificationWithUser } from '../services/notificationService';
import { NotificationType, NotificationStatus } from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { KeenIcon } from '@/components/keenicons';
import NotificationIcon from '@/components/notifications/NotificationIcon';

interface NotificationTableProps {
  notifications: INotificationWithUser[];
  loading: boolean;
  selectedItems: string[];
  onSelectionChange: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onDeleteSingle: (id: string) => void;
}

const NotificationTable: React.FC<NotificationTableProps> = ({
  notifications,
  loading,
  selectedItems,
  onSelectionChange,
  onSelectAll,
  onDeleteSingle
}) => {
  // 알림 타입 표시 텍스트
  const getNotificationTypeText = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return '시스템';
      case NotificationType.TRANSACTION:
        return '결제/캐시';
      case NotificationType.SERVICE:
        return '서비스';
      case NotificationType.SLOT:
        return '슬롯';
      case NotificationType.MARKETING:
        return '마케팅';
      default:
        return '기타';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch (error) {
      return '날짜 없음';
    }
  };

  return (
    <div className="card card-bordered">
      <div className="table-responsive">
        <table className="table table-rounded table-striped border gy-7 gs-7">
          <thead>
            <tr className="fw-bold fs-6 text-gray-800 border-bottom border-gray-200 dark:text-gray-300 dark:border-gray-700">
              <th style={{ width: '25px' }}>
                <div className="form-check form-check-custom form-check-solid me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedItems.length === notifications.length && notifications.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </div>
              </th>
              <th>타입</th>
              <th>제목</th>
              <th>내용</th>
              <th>받는 회원</th>
              <th>회원 유형</th>
              <th>날짜</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-4 text-center">
                  <div className="d-flex justify-content-center align-items-center column-gap-2">
                    <span className="spinner-border spinner-border-sm text-primary"></span>
                  </div>
                  <div className="mt-2 text-gray-600">알림을 불러오는 중...</div>
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  알림이 없습니다
                </td>
              </tr>
            ) : (
              notifications.map(notification => (
                <tr key={notification.id}>
                  <td>
                    <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedItems.includes(notification.id)}
                        onChange={() => onSelectionChange(notification.id)}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <NotificationIcon type={notification.type} size="sm" />
                      <span className={`badge px-2 py-1 ms-2 ${notification.type === NotificationType.SYSTEM
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : notification.type === NotificationType.TRANSACTION
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : notification.type === NotificationType.SERVICE
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                              : notification.type === NotificationType.SLOT
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                                : notification.type === NotificationType.MARKETING
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300'
                        }`}>
                        {getNotificationTypeText(notification.type)}
                      </span>
                    </div>
                  </td>
                  <td>{notification.title}</td>
                  <td>
                    <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notification.message}
                    </div>
                  </td>
                  <td className="text-gray-900 dark:text-gray-300">{notification.userName || '알 수 없음'}</td>
                  <td>
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${notification.userRole === 'developer'
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                        : notification.userRole === 'operator'
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                          : notification.userRole === 'distributor'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                            : notification.userRole === 'agency'
                              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
                              : notification.userRole === 'advertiser'
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                      }`}>
                      {notification.userRole === 'developer'
                        ? '개발자'
                        : notification.userRole === 'operator'
                          ? '운영자'
                          : notification.userRole === 'distributor'
                            ? '총판'
                            : notification.userRole === 'agency'
                              ? '대행사'
                              : notification.userRole === 'advertiser'
                                ? '광고주'
                                : notification.userRole || '기타'}
                    </span>
                  </td>
                  <td>{formatDate(notification.createdAt)}</td>
                  <td>
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${notification.status === NotificationStatus.UNREAD
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                        : notification.status === NotificationStatus.READ
                          ? 'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400'
                          : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                      {notification.status === NotificationStatus.UNREAD
                        ? '읽지 않음'
                        : notification.status === NotificationStatus.READ
                          ? '읽음'
                          : '보관됨'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-icon btn-sm btn-light-danger"
                      onClick={() => onDeleteSingle(notification.id)}
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationTable;