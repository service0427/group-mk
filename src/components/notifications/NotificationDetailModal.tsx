import React from 'react';
import { INotification, NotificationType, NotificationPriority } from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import NotificationIcon from './NotificationIcon';
import { KeenIcon } from '@/components/keenicons';

interface NotificationDetailModalProps {
  notification: INotification;
  onClose: () => void;
  onMarkAsRead?: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  onMarkAsRead,
  onArchive,
  onDelete
}) => {
  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    try {
      if (!dateString) {
        return '날짜 정보 없음';
      }

      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const formatted = format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
      return formatted;
    } catch (error) {
      return '날짜 형식 오류';
    }
  };

  // 알림 타입 한글 변환
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

  // 중요도 텍스트 변환
  const getPriorityText = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.HIGH:
        return '높음';
      case NotificationPriority.MEDIUM:
        return '중간';
      case NotificationPriority.LOW:
        return '낮음';
      default:
        return '일반';
    }
  };

  // 배경색 선택
  const getBgColorClass = () => {
    switch (notification.type) {
      case NotificationType.SYSTEM:
        return 'bg-blue-50';
      case NotificationType.TRANSACTION:
        return 'bg-green-50';
      case NotificationType.SERVICE:
        return 'bg-purple-50';
      case NotificationType.SLOT:
        return 'bg-orange-50';
      case NotificationType.MARKETING:
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  // 중요도에 따른 테두리 색상 클래스
  const getPriorityBorderClass = () => {
    switch (notification.priority) {
      case NotificationPriority.HIGH:
        return 'border-t-4 border-t-red-500';
      case NotificationPriority.MEDIUM:
        return 'border-t-4 border-t-orange-500';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-md mx-auto ${getPriorityBorderClass()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`${getBgColorClass()} p-4 rounded-t-lg flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <NotificationIcon type={notification.type} size="sm" />
            <div>
              <h3 className="text-lg font-medium">{notification.title}</h3>
              <div className="text-sm text-gray-600 mt-1">
                {formatDate(notification.createdAt)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${notification.type === NotificationType.SYSTEM
                    ? 'bg-blue-100 text-blue-700'
                    : notification.type === NotificationType.TRANSACTION
                      ? 'bg-green-100 text-green-700'
                      : notification.type === NotificationType.SERVICE
                        ? 'bg-purple-100 text-purple-700'
                        : notification.type === NotificationType.SLOT
                          ? 'bg-orange-100 text-orange-700'
                          : notification.type === NotificationType.MARKETING
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                  }`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${notification.type === NotificationType.SYSTEM
                      ? 'bg-blue-500'
                      : notification.type === NotificationType.TRANSACTION
                        ? 'bg-green-500'
                        : notification.type === NotificationType.SERVICE
                          ? 'bg-purple-500'
                          : notification.type === NotificationType.SLOT
                            ? 'bg-orange-500'
                            : notification.type === NotificationType.MARKETING
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                    }`}></span>
                  {getNotificationTypeText(notification.type)}
                </span>

                {/* 중요도 표시 */}
                {notification.priority === NotificationPriority.HIGH && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <span className="mr-1 flex-shrink-0">
                      <i className="ki-notification-bing text-xs"></i>
                    </span>
                    중요
                  </span>
                )}
                {notification.priority === NotificationPriority.MEDIUM && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <span className="mr-1 flex-shrink-0">
                      <i className="ki-notification text-xs"></i>
                    </span>
                    중간
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full"
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">알림 내용</h4>
            <div className="border border-gray-100 rounded-md p-3 bg-gray-50/50">
              <p className="text-gray-700 whitespace-pre-wrap">{notification.message}</p>
            </div>
          </div>

          {/* 알림 정보 섹션 제거 */}

          {/* 링크가 있는 경우 링크 버튼 표시 - 크기를 더 작게 수정 */}
          {notification.link && (
            <div className="mb-4">
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-1.5 rounded text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <i className="ki-external text-sm mr-1.5"></i>
                관련 페이지로 이동
              </a>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <div className="flex gap-2">
              <button
                className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white px-6"
                onClick={() => {
                  if (onArchive) {
                    onArchive(notification.id);
                  }
                  onClose();
                }}
              >
                보관
              </button>
              <button
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white px-6"
                onClick={() => {
                  if (onDelete) {
                    onDelete(notification.id);
                  }
                  onClose();
                }}
              >
                삭제
              </button>
            </div>
            <button
              className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white px-6"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;