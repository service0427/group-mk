import { useEffect, useRef, useState } from 'react';
import { getHeight } from '@/utils';
import { useViewport } from '@/hooks';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdownItem } from './items/NotificationDropdownItem';
import { NotificationStatus } from '@/types/notification';

const DropdownNotificationsAll = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const offset = 300;

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    loading
  } = useNotifications();

  useEffect(() => {
    if (footerRef.current) {
      const footerHeight = getHeight(footerRef.current);
      const availableHeight = viewportHeight - footerHeight - offset;
      setListHeight(availableHeight);
    }
  }, [viewportHeight]);

  const buildList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-5">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="py-8 px-5 text-center text-gray-500">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="ki-notification text-gray-400 text-xl"></i>
            </div>
          </div>
          <p>알림이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 pt-3 pb-4">
        {notifications.map(notification => (
          <div key={notification.id}>
            <NotificationDropdownItem
              notification={notification}
              onRead={markAsRead}
              onArchive={archiveNotification}
            />
            <div className="border-b border-b-gray-200 mt-3"></div>
          </div>
        ))}
      </div>
    );
  };

  const buildFooter = () => {
    return (
      <>
        <div className="border-b border-b-gray-200"></div>
        <div className="grid grid-cols-2 p-5 gap-2.5">
          <button
            className="btn btn-sm btn-light justify-center"
            onClick={() => {
              const unreadNotifications = notifications
                .filter(n => n.status === NotificationStatus.UNREAD)
                .map(n => n.id);

              if (unreadNotifications.length > 0) {
                unreadNotifications.forEach(id => archiveNotification(id));
              }
            }}
          >
            모두 보관
          </button>
          <button
            className="btn btn-sm btn-light justify-center"
            onClick={() => markAllAsRead()}
          >
            모두 읽음
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="grow">
      <div className="scrollable-y-auto" style={{ maxHeight: `${listHeight}px` }}>
        {buildList()}
      </div>
      <div ref={footerRef}>{buildFooter()}</div>
    </div>
  );
};

export { DropdownNotificationsAll };