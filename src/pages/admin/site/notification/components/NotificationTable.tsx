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
    <div className="bg-card">
      {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
      <div className="hidden md:block overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            알림이 없습니다
          </div>
        ) : (
          <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-muted dark:bg-gray-800/60">
                <th className="py-3 px-3 text-start">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-sm checkbox-primary" 
                      checked={selectedItems.length === notifications.length && notifications.length > 0}
                      onChange={(e) => onSelectAll(e.target.checked)}
                    />
                  </div>
                </th>
                <th className="py-3 px-3 text-center font-medium">타입</th>
                <th className="py-3 px-3 text-start font-medium min-w-[180px]">제목</th>
                <th className="py-3 px-3 text-start font-medium min-w-[200px]">내용</th>
                <th className="py-3 px-3 text-center font-medium min-w-[150px]">받는 회원</th>
                <th className="py-3 px-3 text-center font-medium min-w-[120px]">회원 유형</th>
                <th className="py-3 px-3 text-center font-medium min-w-[150px]">날짜</th>
                <th className="py-3 px-3 text-center font-medium min-w-[100px]">상태</th>
                <th className="py-3 px-3 text-center font-medium min-w-[80px]">작업</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(notification => (
                <tr key={notification.id} className="border-b border-border hover:bg-muted/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={selectedItems.includes(notification.id)}
                        onChange={() => onSelectionChange(notification.id)}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <NotificationIcon type={notification.type} size="sm" />
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        notification.type === NotificationType.SYSTEM
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
                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-400">
                    <div className="max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {notification.message}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-900 dark:text-white">
                    {notification.userName || '알 수 없음'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      notification.userRole === 'developer'
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
                  <td className="py-3 px-3 text-center">
                    {formatDate(notification.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      notification.status === NotificationStatus.UNREAD
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
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <button
                        className="btn btn-icon btn-sm btn-ghost hover:bg-danger/10 hover:text-danger"
                        onClick={() => onDeleteSingle(notification.id)}
                        title="알림 삭제"
                      >
                        <KeenIcon icon="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
      <div className="block md:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            알림이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(notification => (
              <div key={notification.id} className="p-4 hover:bg-muted/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary mr-3"
                      checked={selectedItems.includes(notification.id)}
                      onChange={() => onSelectionChange(notification.id)}
                    />
                    <NotificationIcon type={notification.type} size="sm" />
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ml-2 ${
                      notification.type === NotificationType.SYSTEM
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
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    notification.status === NotificationStatus.UNREAD
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
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">제목</p>
                    <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">내용</p>
                    <p className="line-clamp-2 text-gray-700 dark:text-gray-400">{notification.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-muted-foreground">받는 회원</p>
                      <p className="font-medium text-gray-900 dark:text-white">{notification.userName || '알 수 없음'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">회원 유형</p>
                      <p className="font-medium">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          notification.userRole === 'developer'
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
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">날짜</p>
                    <p className="font-medium">{formatDate(notification.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    className="btn btn-icon btn-sm btn-ghost hover:bg-danger/10 hover:text-danger"
                    onClick={() => onDeleteSingle(notification.id)}
                    title="알림 삭제"
                  >
                    <KeenIcon icon="trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTable;