import React from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { INotification, NotificationPriority, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationDropdownItemProps {
  notification: INotification;
  onRead?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const NotificationDropdownItem: React.FC<NotificationDropdownItemProps> = ({
  notification,
  onRead,
  onArchive
}) => {
  // 알림 타입 아이콘 클래스
  const getTypeIconClass = () => {
    switch(notification.type) {
      case NotificationType.SYSTEM:
        return 'ki-info-circle text-blue-600';
      case NotificationType.TRANSACTION:
        return 'ki-dollar text-green-600';
      case NotificationType.SERVICE:
        return 'ki-setting-2 text-purple-600';
      case NotificationType.SLOT:
        return 'ki-cube-2 text-orange-600';
      case NotificationType.MARKETING:
        return 'ki-percentage-circle text-yellow-600';
      default:
        return 'ki-notification text-gray-600';
    }
  };
  
  // 알림 타입 배경 클래스
  const getTypeBgClass = () => {
    switch(notification.type) {
      case NotificationType.SYSTEM:
        return 'bg-blue-100';
      case NotificationType.TRANSACTION:
        return 'bg-green-100';
      case NotificationType.SERVICE:
        return 'bg-purple-100';
      case NotificationType.SLOT:
        return 'bg-orange-100';
      case NotificationType.MARKETING:
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  // 시간 포맷팅
  const getFormattedTime = () => {
    try {
      const date = typeof notification.createdAt === 'string' 
        ? new Date(notification.createdAt) 
        : notification.createdAt;
      
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: ko
      });
    } catch (error) {
      return '알 수 없음';
    }
  };
  
  return (
    <div className={`flex grow gap-2.5 px-5 py-3 ${
      notification.priority === NotificationPriority.HIGH 
        ? 'border-l-4 border-l-red-500' 
      : notification.priority === NotificationPriority.MEDIUM
        ? 'border-l-4 border-l-orange-500'
      : ''
    }`}>
      <div className="relative shrink-0 mt-0.5">
        <div className={`w-8 h-8 rounded-full ${getTypeBgClass()} flex items-center justify-center`}>
          <i className={getTypeIconClass()}></i>
        </div>
        
        {/* 중요도 표시 */}
        {notification.priority === NotificationPriority.HIGH && (
          <div className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
            <i className="ki-notification-bing text-[8px]"></i>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-grow">
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {notification.title}
          </span>
          <span className="text-xs text-gray-500">{getFormattedTime()}</span>
        </div>
        
        <p className="text-xs text-gray-700 line-clamp-2">{notification.message}</p>
        
        <div className="flex items-center gap-2 mt-1.5">
          {/* 알림 상세 페이지 링크 */}
          <Link
            to={`/myinfo/notifications?id=${notification.id}`} 
            className="text-xs text-primary hover:underline"
            onClick={() => onRead && onRead(notification.id)}
          >
            자세히 보기
          </Link>
          
          {/* 외부 링크가 있는 경우 */}
          {notification.link && (
            <a 
              href={notification.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
              onClick={() => onRead && onRead(notification.id)}
            >
              <i className="ki-arrow-right text-[8px] mr-1"></i>
              바로가기
            </a>
          )}
        </div>
      </div>
      
      {/* 액션 버튼 */}
      <div className="flex flex-col gap-1 ml-2">
        {/* 보관 버튼 */}
        <button 
          className="text-gray-400 hover:text-purple-500 p-1"
          onClick={() => onArchive && onArchive(notification.id)}
          title="보관하기"
        >
          <KeenIcon icon="archive" className="size-4" />
        </button>
        
        {/* 읽음 처리 버튼 */}
        <button 
          className="text-gray-400 hover:text-primary p-1"
          onClick={() => onRead && onRead(notification.id)}
          title="읽음 표시"
        >
          <KeenIcon icon="check-square" className="size-4" />
        </button>
      </div>
    </div>
  );
};

export { NotificationDropdownItem };