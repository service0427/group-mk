import React from 'react';
import { NotificationType } from '@/types/notification';

interface NotificationIconProps {
  type: NotificationType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 알림 유형에 따른 아이콘 컴포넌트
 */
const NotificationIcon: React.FC<NotificationIconProps> = ({
  type,
  size = 'md',
  className = ''
}) => {
  // 아이콘 이름 선택
  const getIconName = () => {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'info-circle';
      case NotificationType.TRANSACTION:
        return 'dollar';
      case NotificationType.SERVICE:
        return 'setting-2';
      case NotificationType.SLOT:
        return 'cube-2';
      case NotificationType.MARKETING:
        return 'percentage';
      default:
        return 'notification';
    }
  };

  // 아이콘 배경 색상 선택
  const getBackgroundClass = () => {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'bg-blue-100 text-blue-600';
      case NotificationType.TRANSACTION:
        return 'bg-green-100 text-green-600';
      case NotificationType.SERVICE:
        return 'bg-purple-100 text-purple-600';
      case NotificationType.SLOT:
        return 'bg-orange-100 text-orange-600';
      case NotificationType.MARKETING:
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // 아이콘 크기 선택
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      case 'md':
      default:
        return 'w-10 h-10';
    }
  };

  return (
    <div className={`
      ${getSizeClass()} 
      ${getBackgroundClass()} 
      rounded-full flex items-center justify-center
      ${className}
    `}>
      <i className={`ki-${getIconName()}`}></i>
    </div>
  );
};

export default NotificationIcon;