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
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  
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
  
  // 강화된 로그아웃 함수 - 모든 저장소 데이터 삭제
  const performLogout = () => {
    // 이미 로딩 중이면 중복 실행 방지
    if (isLogoutLoading) return;
    
    setIsLogoutLoading(true);
    setShowLogoutModal(false); // 모달 즉시 닫기
    
    try {
      // 1. 모든 auth 관련 로컬 스토리지 항목 제거
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('email');
      
      // 2. 모든 auth 관련 세션 스토리지 항목 제거
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('lastAuthCheck');
      sessionStorage.removeItem('supabase.auth.token');
      
      // 3. 추가적으로 'auth'로 시작하는 모든 스토리지 항목 제거 (Supabase 관련)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // 4. 쿠키 제거 시도 (Supabase가 쿠키 사용하는 경우)
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // 5. 서버 로그아웃 동기적으로 처리 (페이지 이동 전)
      // 짧은 타임아웃으로 서버 로그아웃 시도하고 실패해도 진행
      if (logout) {
        try {
          logout();
        } catch (err) {
          console.warn('서버 로그아웃 실패, 무시하고 진행:', err);
        }
      }
      
      // 6. 로그인 페이지로 강제 이동 (캐시 우회 파라미터 추가)
      const timestamp = new Date().getTime();
      window.location.href = `/auth/login?t=${timestamp}`;
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      // 오류 발생해도 로그인 페이지로 강제 이동
      window.location.href = '/auth/login';
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
              onClick={performLogout}
              disabled={isLogoutLoading}
            >
              {isLogoutLoading ? '처리 중...' : '로그아웃'}
            </button>
            <button 
              type="button" 
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 px-5" 
              onClick={() => setShowLogoutModal(false)}
              disabled={isLogoutLoading}
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
        disabled={isLogoutLoading}
      >
        {isLogoutLoading ? (
          <span className="animate-spin">⊝</span>
        ) : (
          <KeenIcon icon="exit-right" className="text-base" />
        )}
      </button>
    </div>
  );
};

export { HeaderTopbar };