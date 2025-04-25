import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';
import { Menu, MenuItem, MenuToggle } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { DropdownUser } from '@/partials/dropdowns/user';
import { useLanguage } from '@/i18n';
import { NotificationDropdown } from '@/components/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuthContext } from '@/auth';

const HeaderTopbar = () => {
  const { isRTL } = useLanguage();
  const itemUserRef = useRef<any>(null);
  const { unreadCount, fetchNotifications } = useNotifications();
  const { logout } = useAuthContext();
  const navigate = useNavigate();

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

  // 로그아웃 모달 표시 상태
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // 로그아웃 처리 함수
  const handleLogout = () => {
    // 모바일에서는 즉시 로그아웃, 데스크톱에서는 확인 모달 표시
    if (window.innerWidth < 768) {
      performLogout();
    } else {
      // 로그아웃 확인 모달 표시
      setShowLogoutModal(true);
    }
  };
  
  // 실제 로그아웃 실행 함수
  const performLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      alert('로그아웃 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="flex items-center gap-2 lg:gap-3.5">
      {/* 로그아웃 확인 모달 - shadcn UI 대화상자로 구현 */}
      <Dialog open={showLogoutModal} onOpenChange={(open) => setShowLogoutModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">로그아웃 확인</DialogTitle>
          </DialogHeader>
          <DialogBody className="text-center py-6">
            <div className="flex flex-col items-center justify-center">
              <KeenIcon icon="information-3" className="text-warning text-5xl mb-4" />
              <h3 className="font-medium text-lg mb-3">정말 로그아웃 하시겠습니까?</h3>
              <DialogDescription className="text-gray-600">
                로그아웃하면 다시 로그인해야 합니다.
              </DialogDescription>
            </div>
          </DialogBody>
          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <button 
              type="button" 
              className="btn bg-red-600 hover:bg-red-700 text-white px-5" 
              onClick={() => {
                setShowLogoutModal(false);
                performLogout();
              }}
            >
              로그아웃
            </button>
            <button 
              type="button" 
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 px-5" 
              onClick={() => setShowLogoutModal(false)}
            >
              취소
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 알림 드롭다운 - MenuItem 방식으로 변경됨 */}
      <NotificationDropdown />

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
      
      {/* 로그아웃 버튼 */}
      <button 
        className="btn btn-icon btn-outline-danger transition-all hover:bg-danger hover:text-white ms-1 size-9 rounded-full"
        onClick={handleLogout}
        title="로그아웃"
      >
        <KeenIcon icon="exit-right" className="text-base" />
      </button>
    </div>
  );
};

export { HeaderTopbar };