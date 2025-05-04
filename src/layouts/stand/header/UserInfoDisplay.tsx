import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components/keenicons';
import { getUserCashBalance } from '@/pages/withdraw/services/withdrawService';
import { supabase } from '@/supabase';
import { NotificationDropdown } from '@/components/notifications';
import { useLanguage } from '@/i18n';
import { toAbsoluteUrl } from '@/utils';
import { useSettings } from '@/providers/SettingsProvider';
import { FormattedMessage } from 'react-intl';
import { Menu, MenuItem, MenuToggle, MenuSub } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const UserInfoDisplay = () => {
  const { currentUser, logout } = useAuthContext();
  const { isRTL } = useLanguage();
  const { settings, storeSettings } = useSettings();
  const navigate = useNavigate();
  const userMenuRef = useRef<any>(null);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // 사용자의 캐시 잔액 조회
  useEffect(() => {
    const fetchCashBalance = async () => {
      if (!currentUser?.id) return;
      
      setIsLoading(true);
      try {
        const balance = await getUserCashBalance(currentUser.id);
        setCashBalance(balance);
      } catch (error) {
        console.error('캐시 잔액 조회 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCashBalance();

    // 실시간 잔액 업데이트를 위한 구독 설정
    const subscription = supabase
      .channel('user_balances_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_balances',
          filter: `user_id=eq.${currentUser?.id}` 
        }, 
        () => {
          fetchCashBalance();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id]);

  // 다크 모드 토글 핸들러
  const handleThemeMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    storeSettings({
      themeMode: newThemeMode
    });
  };

  // 로그아웃 버튼 클릭 핸들러
  const handleLogoutClick = () => {
    // 모바일에서는 즉시 로그아웃, 데스크톱에서는 확인 모달 표시
    if (window.innerWidth < 768) {
      performLogout();
    } else {
      // 로그아웃 확인 모달 표시
      setShowLogoutModal(true);
    }
  };
  
  // 실제 로그아웃 처리 함수
  const performLogout = async () => {
    if (isLogoutLoading) return;
    
    setIsLogoutLoading(true);
    setShowLogoutModal(false); // 모달 즉시 닫기
    
    try {
      // 서버 로그아웃 처리
      await logout();
      
      // 추가 정리 작업
      localStorage.removeItem('auth');
      localStorage.removeItem('user');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('lastAuthCheck');
      
      // 로그인 페이지로 리다이렉트
      navigate('/auth/login');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      setIsLogoutLoading(false);
      
      // 오류 발생해도 로그인 페이지로 강제 이동
      const timestamp = new Date().getTime();
      window.location.href = `/auth/login?t=${timestamp}`;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      {/* 로그아웃 확인 모달 */}
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
      
      {/* 통합 헤더 컴포넌트 */}
      <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5">
        {/* 알림 드롭다운 */}
        <div className="px-2 border-r border-blue-200 dark:border-blue-800">
          <NotificationDropdown containerClassName="flex items-center" />
        </div>
        
        {/* 사용자 정보 드롭다운 */}
        <Menu>
          <MenuItem
            ref={userMenuRef}
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
            <MenuToggle className="flex px-3 py-1.5 hover:bg-blue-100/80 dark:hover:bg-blue-800/50 transition-colors rounded-md cursor-pointer">
              <div className="flex items-center">
                {/* 사용자 아이콘 */}
                <div className="flex-shrink-0 mr-3 flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded-full size-9 border-2 border-blue-300 dark:border-blue-600">
                  <KeenIcon icon="user" className="text-blue-600 dark:text-blue-300 text-xl" />
                </div>
                
                {/* 사용자 정보 - 2줄 레이아웃 */}
                <div className="flex flex-col justify-center">
                  {/* 1줄: 사용자 이름 */}
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {currentUser.full_name || '사용자'}
                  </div>
                  
                  {/* 2줄: 캐시 잔액 */}
                  <div className="flex items-center">
                    <KeenIcon icon="dollar" className="text-success dark:text-green-300 mr-1 text-sm" />
                    <div className="text-xs font-medium text-success dark:text-green-300 whitespace-nowrap">
                      {isLoading ? (
                        <span className="animate-pulse">로딩중...</span>
                      ) : (
                        new Intl.NumberFormat('ko-KR').format(cashBalance) + '원'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </MenuToggle>
            
            {/* 사용자 드롭다운 메뉴 */}
            <MenuSub className="menu-default dark:bg-coal-700 dark:border-coal-600 light:border-gray-300 w-[220px] md:w-[250px]">
              <div className="menu-item">
                <Link to="/myinfo/profile" className="menu-link dark:hover:bg-coal-600">
                  <span className="menu-icon">
                    <KeenIcon icon="profile-circle" className="dark:text-blue-300" />
                  </span>
                  <span className="menu-title dark:text-white">내 정보 관리</span>
                </Link>
              </div>
              
              <div className="menu-item mb-0.5">
                <div className="menu-link dark:hover:bg-coal-600">
                  <span className="menu-icon">
                    <KeenIcon icon="moon" className="dark:text-blue-300" />
                  </span>
                  <span className="menu-title dark:text-white">
                    <FormattedMessage id="USER.MENU.DARK_MODE" />
                  </span>
                  <label className="switch switch-sm">
                    <input
                      name="theme"
                      type="checkbox"
                      checked={settings.themeMode === 'dark'}
                      onChange={handleThemeMode}
                      value="1"
                    />
                  </label>
                </div>
              </div>
            </MenuSub>
          </MenuItem>
        </Menu>
        
        {/* 구분선 */}
        <div className="h-8 mx-1 border-l border-blue-200 dark:border-blue-800"></div>
        
        {/* 로그아웃 버튼 */}
        <div className="px-2">
          <button 
            className="btn btn-icon btn-outline-danger dark:border-red-600 dark:text-red-400 transition-all hover:bg-danger dark:hover:bg-red-600 hover:text-white dark:hover:text-white size-9 rounded-full"
            onClick={handleLogoutClick}
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
      </div>
    </div>
  );
};

export { UserInfoDisplay };