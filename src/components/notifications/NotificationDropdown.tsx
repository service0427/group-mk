import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { INotification, NotificationType, NotificationStatus } from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import NotificationIcon from './NotificationIcon';
import NotificationDetailModal from './NotificationDetailModal';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, loading, unreadCount } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);
  
  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch (error) {
      return '날짜 없음';
    }
  };
  
  // 알림 클릭 처리
  const handleNotificationClick = (notification: INotification) => {
    // 읽지 않은 알림인 경우 읽음 처리
    if (notification.status === NotificationStatus.UNREAD) {
      markAsRead(notification.id);
    }
    
    // 자세히 보기 모달 표시
    setSelectedNotification(notification);
  };
  
  // 모두 보기 클릭 처리
  const handleViewAllClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    // 약간의 지연 후 페이지 이동 (드롭다운 닫힘 애니메이션 완료 후)
    setTimeout(() => {
      navigate('/myinfo/notifications');
    }, 10);
  };
  
  // 알림 설정 클릭 처리
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    // 약간의 지연 후 페이지 이동 (드롭다운 닫힘 애니메이션 완료 후)
    setTimeout(() => {
      navigate('/myinfo/profile');
    }, 10);
  };
  
  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-1 w-96 bg-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
      style={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-card-foreground">알림</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={async (e) => {
                e.preventDefault();
                await markAllAsRead();
                // 상태 갱신을 위해 명시적으로 알림 데이터 다시 가져오기
                fetchNotifications();
              }}
              className={`text-xs ${
                unreadCount > 0 
                  ? 'text-primary hover:text-primary-dark dark:hover:text-primary-light hover:underline cursor-pointer' 
                  : 'text-muted-foreground cursor-not-allowed'
              }`}
              disabled={unreadCount === 0}
            >
              모두 읽음
            </button>
            <a 
              href="#" 
              onClick={handleViewAllClick} 
              className="text-xs text-primary hover:underline"
            >
              모두 보기
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="flex justify-center items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <div className="mt-2">알림을 불러오는 중...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            새로운 알림이 없습니다
          </div>
        ) : (
          <div>
            {unreadCount > 0 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-muted-foreground font-medium">
                읽지 않은 알림 ({unreadCount})
              </div>
            )}
            
            {notifications
              .filter(notification => notification.status === NotificationStatus.UNREAD)
              .slice(0, 5)
              .map(notification => (
                <div 
                  key={notification.id}
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer bg-blue-50 dark:bg-blue-900/20"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <NotificationIcon type={notification.type} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-card-foreground">{notification.title}</h4>
                        <span className={`text-2xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                          notification.type === NotificationType.SYSTEM 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300' 
                          : notification.type === NotificationType.TRANSACTION 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-300'
                          : notification.type === NotificationType.SERVICE
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300'
                          : notification.type === NotificationType.SLOT
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300'
                          : notification.type === NotificationType.MARKETING
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/70 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          <span className={`inline-block w-1 h-1 rounded-full ${
                            notification.type === NotificationType.SYSTEM 
                              ? 'bg-blue-500 dark:bg-blue-400' 
                            : notification.type === NotificationType.TRANSACTION 
                              ? 'bg-green-500 dark:bg-green-400'
                            : notification.type === NotificationType.SERVICE
                              ? 'bg-purple-500 dark:bg-purple-400'
                            : notification.type === NotificationType.SLOT
                              ? 'bg-orange-500 dark:bg-orange-400'
                            : notification.type === NotificationType.MARKETING
                              ? 'bg-yellow-500 dark:bg-yellow-400'
                            : 'bg-gray-500 dark:bg-gray-400'
                          }`}></span>
                          {notification.type === NotificationType.SYSTEM 
                            ? '시스템' 
                            : notification.type === NotificationType.TRANSACTION 
                              ? '결제/캐시'
                            : notification.type === NotificationType.SERVICE
                              ? '서비스'
                            : notification.type === NotificationType.SLOT
                              ? '슬롯'
                            : notification.type === NotificationType.MARKETING
                              ? '마케팅'
                            : '기타'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <span className="text-2xs text-muted-foreground mt-1 block">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            
            {notifications
              .filter(notification => notification.status === NotificationStatus.READ)
              .length > 0 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-muted-foreground font-medium">
                  이전 알림
                </div>
              )}
            
            {notifications
              .filter(notification => notification.status === NotificationStatus.READ)
              .slice(0, 5 - Math.min(5, notifications.filter(n => n.status === NotificationStatus.UNREAD).length))
              .map(notification => (
                <div 
                  key={notification.id}
                  className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <NotificationIcon type={notification.type} size="sm" className="opacity-60" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{notification.title}</h4>
                        <span className={`text-2xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                          notification.type === NotificationType.SYSTEM 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300' 
                          : notification.type === NotificationType.TRANSACTION 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-300'
                          : notification.type === NotificationType.SERVICE
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300'
                          : notification.type === NotificationType.SLOT
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300'
                          : notification.type === NotificationType.MARKETING
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/70 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          <span className={`inline-block w-1 h-1 rounded-full ${
                            notification.type === NotificationType.SYSTEM 
                              ? 'bg-blue-500 dark:bg-blue-400' 
                            : notification.type === NotificationType.TRANSACTION 
                              ? 'bg-green-500 dark:bg-green-400'
                            : notification.type === NotificationType.SERVICE
                              ? 'bg-purple-500 dark:bg-purple-400'
                            : notification.type === NotificationType.SLOT
                              ? 'bg-orange-500 dark:bg-orange-400'
                            : notification.type === NotificationType.MARKETING
                              ? 'bg-yellow-500 dark:bg-yellow-400'
                            : 'bg-gray-500 dark:bg-gray-400'
                          }`}></span>
                          {notification.type === NotificationType.SYSTEM 
                            ? '시스템' 
                            : notification.type === NotificationType.TRANSACTION 
                              ? '결제/캐시'
                            : notification.type === NotificationType.SERVICE
                              ? '서비스'
                            : notification.type === NotificationType.SLOT
                              ? '슬롯'
                            : notification.type === NotificationType.MARKETING
                              ? '마케팅'
                            : '기타'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <span className="text-2xs text-muted-foreground mt-1 block">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <a 
          href="#" 
          className="text-xs text-muted-foreground hover:text-primary w-full block text-center"
          onClick={handleSettingsClick}
        >
          알림 설정
        </a>
      </div>
      
      {/* 알림 상세 모달 */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={markAsRead}
        />
      )}
    </div>
  );
};

export default NotificationDropdown;