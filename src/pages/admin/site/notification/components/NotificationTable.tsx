import React from 'react';
import { INotificationWithUser } from '../services/notificationService';
import { NotificationType, NotificationStatus } from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { KeenIcon } from '@/components/keenicons';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import { USER_ROLES, getRoleDisplayName, getRoleBadgeColor } from '@/config/roles.config';

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
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-${getRoleBadgeColor(notification.userRole)}-100 dark:bg-${getRoleBadgeColor(notification.userRole)}-900/40 text-${getRoleBadgeColor(notification.userRole)}-800 dark:text-${getRoleBadgeColor(notification.userRole)}-300`}>
                      {getRoleDisplayName(notification.userRole) || '기타'}
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
            {notifications.map((notification, index) => (
              <div key={notification.id} className="p-4 hover:bg-muted/40">
                <div className="flex gap-3">
                  {/* 왼쪽: 체크박스와 번호 */}
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={selectedItems.includes(notification.id)}
                      onChange={() => onSelectionChange(notification.id)}
                    />
                    <div className="flex-none w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/60 font-medium text-sm">
                      {index + 1}
                    </div>
                  </div>
                  {/* 오른쪽: 알림 내용 */}
                  <div className="flex-1 min-w-0">
                    {/* 헤더: 타입과 상태 뱃지 */}
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1">
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

                    {/* 제목 */}
                    <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-1">
                      {notification.title}
                    </h3>
                    
                    {/* 내용 */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {notification.message}
                    </p>

                    {/* 회원 정보와 날짜 */}
                    <div className="flex flex-col gap-1 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <KeenIcon icon="user" className="h-3 w-3 text-gray-500" />
                        <span className="text-muted-foreground mr-1">회원:</span>
                        <span className="font-medium">{notification.userName || '알 수 없음'}</span>
                        <span className={`ml-1 inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-${getRoleBadgeColor(notification.userRole)}-100 dark:bg-${getRoleBadgeColor(notification.userRole)}-900/40 text-${getRoleBadgeColor(notification.userRole)}-800 dark:text-${getRoleBadgeColor(notification.userRole)}-300`}>
                          {getRoleDisplayName(notification.userRole) || '기타'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <KeenIcon icon="calendar" className="h-3 w-3 text-gray-500" />
                        <span className="text-muted-foreground mr-1">날짜:</span>
                        <span className="font-medium">{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex justify-end mt-2">
                      <button
                        className="btn btn-icon btn-sm btn-ghost hover:bg-danger/10 hover:text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSingle(notification.id);
                        }}
                        title="알림 삭제"
                      >
                        <KeenIcon icon="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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