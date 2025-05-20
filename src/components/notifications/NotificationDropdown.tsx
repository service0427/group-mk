import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { INotification, NotificationType, NotificationStatus, NotificationPriority } from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import NotificationIcon from './NotificationIcon';
import NotificationDetailModal from './NotificationDetailModal';
import {
  Menu,
  MenuIcon,
  MenuItem,
  MenuLabel,
  MenuSub,
  MenuTitle,
  MenuToggle
} from '@/components/menu';
import { KeenIcon } from '@/components/keenicons';
import { useLanguage } from '@/i18n';

interface NotificationDropdownProps {
  containerClassName?: string;
  hideTextOnMobile?: boolean; // 모바일에서 텍스트 숨김 여부
  inlineCounterOnly?: boolean; // 인라인 카운터만 표시 여부 (내부 컴포넌트에서 사용)
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  containerClassName, 
  hideTextOnMobile = false,
  inlineCounterOnly = false
}) => {
  const { notifications, markAsRead, markAllAsRead, loading, unreadCount, fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const itemRef = useRef<any>(null);
  const { isRTL } = useLanguage();

  // 컴포넌트 마운트 시 알림 데이터 가져오기 및 주기적 갱신
  useEffect(() => {
    // 컴포넌트 마운트 시 알림 데이터 가져오기
    fetchNotifications();
    
    // 30초마다 알림 데이터 새로고침 (HeaderTopbar의 10초와 중복되지 않도록 30초로 설정)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30초
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
    setModalOpen(true);
    itemRef.current?.hide();
  };

  // 알림 모달 닫기 처리
  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedNotification(null);
    }, 200); // 모달 닫힘 애니메이션 후 상태 정리
  };

  // 알림 센터 바로가기 클릭 처리
  const handleViewAllClick = (e: React.MouseEvent) => {
    e.preventDefault();
    itemRef.current?.hide();
    // 약간의 지연 후 페이지 이동
    setTimeout(() => {
      navigate('/myinfo/notifications');
    }, 10);
  };

  // 중요도 아이콘 (고중요도만 표시)
  const renderPriorityIcon = (priority: NotificationPriority) => {
    if (priority === NotificationPriority.HIGH) {
      return (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm z-10">
          <i className="ki-notification-bing text-[8px]"></i>
        </span>
      );
    }
    return null;
  };

  // 알림 읽음 상태에 따른 스타일 클래스
  const getNotificationStatusClass = (status: NotificationStatus) => {
    return status === NotificationStatus.UNREAD 
      ? 'bg-blue-50 dark:bg-blue-900/20' 
      : '';
  };

  // 알림 타입에 따른 배지 스타일 클래스
  const getTypeBadgeClass = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300';
      case NotificationType.TRANSACTION:
        return 'bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-300';
      case NotificationType.SERVICE:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300';
      case NotificationType.SLOT:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300';
      case NotificationType.MARKETING:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/70 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // 알림 타입에 따른 도트 스타일 클래스
  const getTypeDotClass = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'bg-blue-500 dark:bg-blue-400';
      case NotificationType.TRANSACTION:
        return 'bg-green-500 dark:bg-green-400';
      case NotificationType.SERVICE:
        return 'bg-purple-500 dark:bg-purple-400';
      case NotificationType.SLOT:
        return 'bg-orange-500 dark:bg-orange-400';
      case NotificationType.MARKETING:
        return 'bg-yellow-500 dark:bg-yellow-400';
      default:
        return 'bg-gray-500 dark:bg-gray-400';
    }
  };

  // 인라인 카운터만 표시하는 경우 (모바일 메뉴의 알림 카운터에서 사용)
  if (inlineCounterOnly) {
    return (
      <>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {unreadCount === 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">0</span>
        )}
      </>
    );
  }

  return (
    <>
      <Menu className={`items-stretch ${containerClassName || ''}`}>
        <MenuItem
          ref={itemRef}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: isRTL() ? 'bottom-start' : 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                }
              }
            ]
          }}
        >
          {hideTextOnMobile ? (
            <MenuToggle className="btn btn-icon flex items-center justify-center transition-all hover:bg-blue-500 hover:text-white size-8 rounded-full relative h-9">
              <KeenIcon icon="notification-status" className="text-base" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </MenuToggle>
          ) : (
            <MenuToggle className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors relative">
              <div className="relative flex items-center justify-center">
                <KeenIcon icon="notification-status" className="text-base" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">알림</span>
            </MenuToggle>
          )}
          <MenuSub className="menu-default" rootClassName="w-full max-w-[400px] z-40">
            {/* 헤더 영역 */}
            <div className="py-2 px-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium text-card-foreground dark:text-white">알림</h3>
                <div className="flex items-center">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await markAllAsRead();
                      // 상태 갱신을 위해 명시적으로 알림 데이터 다시 가져오기
                      fetchNotifications();
                    }}
                    className={`text-sm font-medium ${unreadCount > 0
                      ? 'text-primary hover:text-primary-dark dark:hover:text-primary-light hover:underline cursor-pointer'
                      : 'text-muted-foreground cursor-not-allowed'
                      }`}
                    disabled={unreadCount === 0}
                  >
                    모두 읽음
                  </button>
                </div>
              </div>
            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex justify-center items-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <div className="mt-2 dark:text-gray-300">알림을 불러오는 중...</div>
              </div>
            )}

            {/* 알림 없음 상태 */}
            {!loading && notifications.length === 0 && (
              <div className="p-4 text-center text-muted-foreground dark:text-gray-300">
                새로운 알림이 없습니다
              </div>
            )}

            {/* 읽지 않은 알림 섹션 */}
            {!loading && unreadCount > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/70 text-xs text-muted-foreground dark:text-gray-200 font-medium">
                  읽지 않은 알림 ({unreadCount})
                </div>

                {notifications
                  .filter(notification => notification.status === NotificationStatus.UNREAD)
                  .slice(0, 5)
                  .map(notification => (
                    <MenuItem 
                      key={notification.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        notification.status === NotificationStatus.UNREAD ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${
                        // 마지막 아이템이 아닌 경우에만 border 추가
                        (notifications.filter(n => n.status === NotificationStatus.UNREAD).indexOf(notification) < 
                         notifications.filter(n => n.status === NotificationStatus.UNREAD).length - 1) 
                        ? 'border-b border-gray-200 dark:border-gray-700' 
                        : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <MenuLabel className="py-1.5 px-3">
                        <div className="flex gap-3 w-full">
                          <div className="mt-1 relative flex-shrink-0">
                            <NotificationIcon type={notification.type} size="sm" />
                            {renderPriorityIcon(notification.priority)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-card-foreground dark:text-white truncate max-w-[240px]">{notification.title}</h4>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                <span className={`text-2xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${getTypeBadgeClass(notification.type)}`}>
                                  <span className={`inline-block w-1 h-1 rounded-full ${getTypeDotClass(notification.type)}`}></span>
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

                                {notification.priority === NotificationPriority.HIGH && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                    <span className="mr-0.5 flex-shrink-0">
                                      <i className="ki-notification-bing text-[8px]"></i>
                                    </span>
                                    중요
                                  </span>
                                )}
                                {notification.priority === NotificationPriority.MEDIUM && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                                    <span className="mr-0.5 flex-shrink-0">
                                      <i className="ki-notification text-[8px]"></i>
                                    </span>
                                    중간
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground dark:text-white line-clamp-2">{notification.message}</p>

                            {notification.link && (
                              <div className="mt-1.5">
                                <button
                                  className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation(); // 부모 클릭 이벤트 방지
                                    
                                    // 읽지 않은 알림이면 읽음 처리
                                    if (notification.status === NotificationStatus.UNREAD) {
                                      markAsRead(notification.id);
                                    }
                                    
                                    // 드롭다운 닫기
                                    itemRef.current?.hide();
                                    
                                    // 약간의 지연 후 페이지 이동 (드롭다운이 닫히는 시간 고려)
                                    setTimeout(() => {
                                      // 경로 정리 후 navigate 사용
                                      let path = notification.link || '';
                                      // 이미 #이 포함된 경로 처리
                                      if (path.startsWith('#')) {
                                        path = path.substring(1); // # 제거
                                      }
                                      // 슬래시로 시작하지 않으면 추가
                                      if (!path.startsWith('/') && path.length > 0) {
                                        path = '/' + path;
                                      }
                                      
                                      navigate(path);
                                    }, 10);
                                  }}
                                >
                                  <i className="ki-arrow-right text-[8px] mr-0.5"></i>
                                  바로가기
                                </button>
                              </div>
                            )}

                            <span className="text-2xs text-muted-foreground dark:text-white/80 mt-1 block">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </MenuLabel>
                    </MenuItem>
                  ))}
              </>
            )}

            {/* 이전 알림 섹션 */}
            {!loading && notifications.filter(notification => notification.status === NotificationStatus.READ).length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/70 text-xs text-muted-foreground dark:text-gray-200 font-medium">
                  이전 알림
                </div>

                {notifications
                  .filter(notification => notification.status === NotificationStatus.READ)
                  .slice(0, 5 - Math.min(5, notifications.filter(n => n.status === NotificationStatus.UNREAD).length))
                  .map(notification => (
                    <MenuItem 
                      key={notification.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        // 마지막 아이템이 아닌 경우에만 border 추가
                        (notifications.filter(n => n.status === NotificationStatus.READ).indexOf(notification) < 
                         notifications.filter(n => n.status === NotificationStatus.READ).length - 1) 
                        ? 'border-b border-gray-200 dark:border-gray-700' 
                        : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <MenuLabel className="py-1.5 px-3">
                        <div className="flex gap-3 w-full">
                          <div className="mt-1 relative flex-shrink-0">
                            <NotificationIcon type={notification.type} size="sm" className="opacity-60" />
                            {renderPriorityIcon(notification.priority)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-muted-foreground dark:text-white truncate max-w-[240px]">{notification.title}</h4>

                              <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                <span className={`text-2xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${getTypeBadgeClass(notification.type)}`}>
                                  <span className={`inline-block w-1 h-1 rounded-full ${getTypeDotClass(notification.type)}`}></span>
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

                                {notification.priority === NotificationPriority.HIGH && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                    <span className="mr-0.5 flex-shrink-0">
                                      <i className="ki-notification-bing text-[8px]"></i>
                                    </span>
                                    중요
                                  </span>
                                )}
                                {notification.priority === NotificationPriority.MEDIUM && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                                    <span className="mr-0.5 flex-shrink-0">
                                      <i className="ki-notification text-[8px]"></i>
                                    </span>
                                    중간
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground dark:text-white line-clamp-2">{notification.message}</p>

                            {notification.link && (
                              <div className="mt-1.5">
                                <button
                                  className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation(); // 부모 클릭 이벤트 방지
                                    
                                    // 드롭다운 닫기
                                    itemRef.current?.hide();
                                    
                                    // 약간의 지연 후 페이지 이동 (드롭다운이 닫히는 시간 고려)
                                    setTimeout(() => {
                                      // 경로 정리 후 navigate 사용
                                      let path = notification.link || '';
                                      // 이미 #이 포함된 경로 처리
                                      if (path.startsWith('#')) {
                                        path = path.substring(1); // # 제거
                                      }
                                      // 슬래시로 시작하지 않으면 추가
                                      if (!path.startsWith('/') && path.length > 0) {
                                        path = '/' + path;
                                      }
                                      
                                      navigate(path);
                                    }, 10);
                                  }}
                                >
                                  <i className="ki-arrow-right text-[8px] mr-0.5"></i>
                                  바로가기
                                </button>
                              </div>
                            )}

                            <span className="text-2xs text-muted-foreground dark:text-white/80 mt-1 block">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </MenuLabel>
                    </MenuItem>
                  ))}
              </>
            )}

            {/* 바닥글 - 알림 센터 바로가기 */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button 
                className="w-full h-10 flex items-center justify-center bg-transparent hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  handleViewAllClick(e);
                }}
              >
                <span className="text-sm text-primary dark:text-blue-400 font-medium">
                  알림 센터 바로가기
                </span>
              </button>
            </div>
          </MenuSub>
        </MenuItem>
      </Menu>

      {/* 알림 상세 모달 - shadcn Dialog로 변경 */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          open={modalOpen}
          onClose={handleModalClose}
          onMarkAsRead={markAsRead}
        />
      )}
    </>
  );
};

export default NotificationDropdown;