import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';
import { Menu, MenuItem, MenuToggle } from '@/components';
import { DropdownUser } from '@/partials/dropdowns/user';
import { useLanguage } from '@/i18n';
import { NotificationDropdown } from '@/components/notifications';
import { useNotifications } from '@/hooks/useNotifications';

const HeaderTopbar = () => {
  const { isRTL } = useLanguage();
  const itemUserRef = useRef<any>(null);
  const { unreadCount, fetchNotifications } = useNotifications();

  // 주기적으로 알림 새로고침
  useEffect(() => {
    // 초기 로드
    fetchNotifications();
    
    // 10초마다 알림 데이터 새로고침
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000); // 10초
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 lg:gap-3.5">
      {/* 알림 아이콘 추가 */}
      {/* 알림 아이콘 및 드롭다운 */}
      <div className="relative">
        <button 
          className={`btn btn-icon btn-icon-lg size-9 rounded-full ${
            isNotificationOpen 
              ? 'bg-primary-light text-primary' 
              : 'hover:bg-primary-light hover:text-primary text-gray-500'
          }`}
          onClick={() => setIsNotificationOpen(prev => !prev)}
          title="알림 센터"
        >
          <KeenIcon icon="notification-status" />
          
          {/* 읽지 않은 알림이 있는 경우 뱃지 표시 */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        {/* 알림 드롭다운 */}
        {isNotificationOpen && (
          <NotificationDropdown 
            onClose={() => setIsNotificationOpen(false)}
          />
        )}

        {/* 테스트 버튼 제거됨 */}
      </div>

      <Menu>
        <MenuItem
          ref={itemUserRef}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: isRTL() ? 'bottom-start' : 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: isRTL() ? [-20, 10] : [20, 10] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle className="btn btn-icon rounded-full">
            <img
              className="size-9 rounded-full border-2 border-success shrink-0"
              src={toAbsoluteUrl('/media/avatars/300-2.png')}
              alt=""
            />
          </MenuToggle>
          {DropdownUser({ menuItemRef: itemUserRef })}
        </MenuItem>
      </Menu>
    </div>
  );
};

export { HeaderTopbar };