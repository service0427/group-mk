import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components/keenicons';
import { getUserCashBalance } from '@/pages/withdraw/services/withdrawService';
import { supabase } from '@/supabase';
import { useLogoutContext } from '@/contexts/LogoutContext';
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
import { Switch } from '@/components/ui/switch';
import { useMediaQuery } from '@/hooks';
import { ChargeModal } from '@/components/cash';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { getRoleDisplayName, getRoleThemeColors } from '@/config/roles.config';

/**
 * 개선된 UserInfoDisplay 컴포넌트
 * LogoutService를 사용하여 일관된 로그아웃 처리
 */
const UserInfoDisplayV2 = () => {
  const { currentUser, logout } = useAuthContext();
  const { isRTL } = useLanguage();
  const { settings, storeSettings } = useSettings();
  const { isLoggingOut, safeApiCall, logoutProgress } = useLogoutContext();
  const navigate = useNavigate();
  const userMenuRef = useRef<any>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [chargeModalOpen, setChargeModalOpen] = useState<boolean>(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(max-width: 1023px)');

  // 사용자의 캐시 잔액 조회 (비기너 역할 특별 처리 추가)
  useEffect(() => {
    // 로그아웃 중이면 실행하지 않음
    if (isLoggingOut) return;

    const fetchCashBalance = async () => {
      if (!currentUser?.id) return;

      setIsLoading(true);
      try {
        // 비기너 사용자는 기본값 0으로 처리
        if (currentUser.role === 'beginner') {
          setCashBalance(0);
        } else {
          // 다른 역할은 실제 잔액 조회 (로그아웃 중이면 무시)
          await safeApiCall(
            async () => {
              try {
                const balance = await getUserCashBalance(currentUser.id || '');
                setCashBalance(balance);
              } catch (error) {
                // 캐시 잔액 조회 오류
                setCashBalance(0); // 오류 시 기본값
              }
            },
            undefined // 반환값 없음 (side effect)
          );
        }
      } catch (error) {
        // 로그아웃 중이 아닐 때만 오류 처리
        if (!isLoggingOut) {
          // 캐시 잔액 처리 중 예외
          setCashBalance(0); // 오류 시 기본값
        }
      } finally {
        // 로그아웃 중이 아닐 때만 상태 업데이트
        if (!isLoggingOut) {
          setIsLoading(false);
        }
      }
    };

    fetchCashBalance();

    // 비기너 역할이 아닌 경우이고 로그아웃 중이 아닌 경우에만 실시간 구독 설정
    let balanceChannel: any = null;

    if (currentUser?.role !== 'beginner' && !isLoggingOut) {
      // 실시간 잔액 업데이트를 위한 구독 설정
      try {
        balanceChannel = supabase
          .channel('user_balances_changes')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_balances',
              filter: `user_id=eq.${currentUser?.id}`
            },
            () => {
              // 로그아웃 중이 아닐 때만 호출
              if (!isLoggingOut) {
                fetchCashBalance();
              }
            }
          )
          .subscribe();
      } catch (subError) {
        // 로그아웃 중이 아닐 때만 오류 처리
        if (!isLoggingOut) {
          // 구독 설정 중 오류
        }
      }
    }

    return () => {
      if (balanceChannel) {
        supabase.removeChannel(balanceChannel);
        balanceChannel = null;
      }
    };
  }, [currentUser?.id, currentUser?.role, isLoggingOut, safeApiCall]);

  // 다크 모드 토글 핸들러
  const handleThemeMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    storeSettings({
      themeMode: newThemeMode
    });
  };

  // 로그아웃 버튼 클릭 핸들러
  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 기본 이벤트 방지

    // 이미 로그아웃 중이면 무시
    if (isLogoutLoading || isLoggingOut) {
      // 이미 로그아웃 처리 중
      return;
    }

    // 모바일에서는 즉시 로그아웃, 데스크톱에서는 확인 모달 표시
    if (window.innerWidth < 768) {
      performLogout();
    } else {
      // 로그아웃 확인 모달 표시
      setShowLogoutModal(true);
    }
  };

  // 실제 로그아웃 처리 함수 - AuthStore 사용
  const performLogout = async () => {
    if (isLogoutLoading) return;

    setIsLogoutLoading(true);
    setShowLogoutModal(false); // 모달 즉시 닫기

    // 로그아웃 시작

    try {
      // AuthStore를 통한 로그아웃
      const authStore = useAuthStore.getState();
      const success = await authStore.logout(navigate);

      if (!success) {
        // 에러 메시지 표시
        toast.error('로그아웃 중 오류가 발생했습니다');
      }
    } catch (error) {
      // 로그아웃 중 예외 발생
      toast.error('로그아웃 중 오류가 발생했습니다');
    } finally {
      setIsLogoutLoading(false);
    }
  };

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // 외부 클릭 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      try {
        // event.target이 존재하는지 확인
        const target = event.target;
        if (!target) return;

        // mobileMenuRef가 없으면 조기 종료
        if (!mobileMenuRef.current) return;

        // target이 Node가 아니면 조기 종료
        if (!(target instanceof Node)) {
          console.warn('Invalid event target type:', target);
          return;
        }

        // target이 Element가 아니면 메뉴 닫기 (document 클릭 등)
        if (!(target instanceof Element)) {
          setMobileMenuOpen(false);
          return;
        }

        // contains 메서드 안전하게 사용
        const isClickInside = mobileMenuRef.current.contains(target);
        const isClickOnTrigger = target.closest('button[data-mobile-menu-trigger="true"]');

        if (!isClickInside && !isClickOnTrigger) {
          setMobileMenuOpen(false);
        }
      } catch (error) {
        // 오류 발생 시 로그 출력 및 메뉴 닫기
        console.warn('모바일 메뉴 클릭 감지 오류:', error);
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      // capture: true로 이벤트 캡처 단계에서 처리
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      document.addEventListener('touchstart', handleClickOutside, { capture: true });
      // wheel 이벤트는 별도로 처리하지 않음
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
    };
  }, [mobileMenuOpen]);

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      {/* 로그아웃 확인 모달 */}
      <Dialog open={showLogoutModal} onOpenChange={(open) => setShowLogoutModal(open)}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
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
              disabled={isLogoutLoading || isLoggingOut}
            >
              {isLogoutLoading || isLoggingOut ? '처리 중...' : '로그아웃'}
            </button>
            <button
              type="button"
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 px-5"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLogoutLoading || isLoggingOut}
            >
              취소
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 모바일 전용 간소화된 사용자 메뉴 */}
      {isMobile ? (
        <>
          {/* 캐시 충전 버튼 - 모바일 */}
          <button
            onClick={() => setChargeModalOpen(true)}
            className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2"
            disabled={isLoggingOut}
            title="캐시 충전"
          >
            <KeenIcon icon="plus-circle" className="text-green-600 dark:text-green-300 text-lg" />
          </button>

          <div className="relative">
            {/* 모바일 버튼 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMobileMenu();
              }}
              className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2"
              data-mobile-menu-trigger="true"
              disabled={isLoggingOut}
              type="button"
            >
              <div className="flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded-full size-8 border-2 border-blue-300 dark:border-blue-600">
                <KeenIcon icon="user" className="text-blue-600 dark:text-blue-300 text-lg" />
              </div>
            </button>

            {/* 모바일 드롭다운 메뉴 */}
            {mobileMenuOpen && !isLoggingOut && createPortal(
              <div
                ref={mobileMenuRef}
                className="fixed right-2 bg-white dark:bg-coal-600 rounded-lg shadow-lg border border-gray-200 dark:border-coal-600 w-[280px] z-[9999] overflow-hidden"
                style={{ top: '60px' }}>
                {/* 사용자 정보 헤더 */}
                <div className="p-3 border-b border-gray-200 dark:border-coal-600">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3 flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded-full size-10 border-2 border-blue-300 dark:border-blue-600">
                      <KeenIcon icon="user" className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {currentUser.full_name || '사용자'}
                        </span>
                        <Badge
                          className={`text-xs px-1.5 py-0 ${getRoleThemeColors(currentUser.role, 'base')} text-white border-0 flex-shrink-0`}
                        >
                          {getRoleDisplayName(currentUser.role || '')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-500 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 캐시 잔액 */}
                <div className="p-3 border-b border-gray-200 dark:border-coal-600">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-800 dark:text-white">캐시 잔액</div>
                    <div className="flex items-center text-success dark:text-green-300 font-medium">
                      <KeenIcon icon="dollar" className="mr-1" />
                      {isLoading ? (
                        <span className="animate-pulse">로딩중...</span>
                      ) : (
                        new Intl.NumberFormat('ko-KR').format(cashBalance) + '원'
                      )}
                    </div>
                  </div>
                </div>

                {/* 알림 카운터 */}
                <div className="p-3 border-b border-gray-200 dark:border-coal-600">
                  <Link
                    to="/myinfo/notifications"
                    className="flex items-center justify-between w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="text-sm text-gray-800 dark:text-white">알림</div>
                    <div className="flex items-center">
                      <KeenIcon icon="notification" className="text-pink-500 dark:text-pink-400 mr-2" />
                      <NotificationDropdown containerClassName="h-auto" inlineCounterOnly />
                    </div>
                  </Link>
                </div>

                {/* 메뉴 항목들 */}
                <div className="py-1 max-h-[300px] overflow-y-auto">
                  <Link
                    to="/myinfo/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-coal-600 w-full text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <KeenIcon icon="profile-circle" className="text-purple-500 dark:text-purple-400 mr-3" />
                    내 정보 관리
                  </Link>
                  <Link
                    to="/cash/history"
                    className="flex items-center px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-coal-600 w-full text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <KeenIcon icon="dollar" className="text-amber-500 dark:text-amber-400 mr-3" />
                    캐시 내역
                  </Link>
                  <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-coal-600">
                    <div className="flex items-center">
                      <KeenIcon icon="moon" className="text-indigo-500 dark:text-indigo-400 mr-3" />
                      다크 모드
                    </div>
                    <Switch
                      checked={settings.themeMode === 'dark'}
                      onCheckedChange={(checked) => {
                        const newThemeMode = checked ? 'dark' : 'light';
                        storeSettings({ themeMode: newThemeMode });
                      }}
                      className="bg-blue-500 data-[state=unchecked]:bg-gray-300"
                    />
                  </div>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-coal-600 w-full text-left"
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleLogoutClick(e);
                    }}
                    disabled={isLogoutLoading || isLoggingOut}
                  >
                    <KeenIcon icon="exit-right" className="text-red-500 dark:text-red-400 mr-3 text-base" />
                    {isLogoutLoading || isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>
        </>
      ) : (
        // 태블릿/데스크톱 버전 - 기존 레이아웃 개선
        <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 h-12 min-w-0">
          {/* 알림 드롭다운 - 태블릿에서는 아이콘만 표시 */}
          <div className="flex items-center h-9 px-2 border-r border-blue-200 dark:border-blue-800 flex-shrink-0">
            <NotificationDropdown
              containerClassName="flex items-center h-full"
              hideTextOnMobile={isTablet}
            />
          </div>

          {/* 캐시 충전 버튼 - 태블릿/데스크톱 */}
          <div className="flex items-center h-9 px-2 border-r border-blue-200 dark:border-blue-800 flex-shrink-0">
            <button
              onClick={() => setChargeModalOpen(true)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-green-100/80 dark:hover:bg-green-800/50 transition-colors rounded-md"
              disabled={isLoggingOut}
              title="캐시 충전"
            >
              <KeenIcon icon="plus-circle" className="text-green-600 dark:text-green-300 text-lg flex-shrink-0" />
              {!isTablet && (
                <span className="text-sm font-medium text-green-600 dark:text-green-300 whitespace-nowrap">충전</span>
              )}
            </button>
          </div>

          {/* 사용자 정보 드롭다운 */}
          <div className="flex items-center h-9 px-2 flex-shrink-0">
            <Menu className="flex-1">
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
                <MenuToggle className="flex items-center pl-3 pr-3 hover:bg-blue-100/80 dark:hover:bg-blue-800/50 transition-colors rounded-md cursor-pointer h-9">
                  <div className="flex items-center min-w-0">
                    {/* 사용자 아이콘 */}
                    <div className="flex-shrink-0 mr-2 flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded-full size-8 border-2 border-blue-300 dark:border-blue-600">
                      <KeenIcon icon="user" className="text-blue-600 dark:text-blue-300 text-lg" />
                    </div>

                    {/* 사용자 정보 - 태블릿에서는 간소화 */}
                    {isTablet ? (
                      <></>
                    ) : (
                      <div className="flex flex-col justify-center min-w-0 max-w-[180px]">
                        {/* 1줄: 사용자 이름과 등급 배지 */}
                        <div className="flex items-center gap-1.5 max-w-full">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]" title={currentUser.full_name || '사용자'}>
                            {currentUser.full_name || '사용자'}
                          </span>
                          <Badge
                            className={`text-[10px] px-1 py-0 ${getRoleThemeColors(currentUser.role, 'base')} text-white border-0 flex-shrink-0`}
                          >
                            {getRoleDisplayName(currentUser.role || '')}
                          </Badge>
                        </div>

                        {/* 2줄: 캐시 잔액 */}
                        <div className="flex items-center min-w-0">
                          <KeenIcon icon="dollar" className="text-success dark:text-green-300 mr-1 text-xs flex-shrink-0" />
                          <div className="text-xs font-medium text-success dark:text-green-300 truncate">
                            {isLoading ? (
                              <span className="animate-pulse">로딩중...</span>
                            ) : (
                              new Intl.NumberFormat('ko-KR').format(cashBalance) + '원'
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </MenuToggle>

                {/* 사용자 드롭다운 메뉴 - 태블릿에서는 추가 정보 포함 */}
                <MenuSub className="menu-default dark:bg-coal-600 dark:border-coal-600 light:border-gray-300 w-[250px]">
                  {isTablet && (
                    <>
                      {/* 태블릿용 사용자 정보 헤더 */}
                      <div className="p-3 border-b border-gray-200 dark:border-coal-600">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3 flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded-full size-10 border-2 border-blue-300 dark:border-blue-600">
                            <KeenIcon icon="user" className="text-blue-600 dark:text-blue-300 text-xl" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {currentUser.full_name || '사용자'}
                              </span>
                              <Badge
                                className={`text-[10px] px-1 py-0 ${getRoleThemeColors(currentUser.role, 'base')} text-white border-0 flex-shrink-0`}
                              >
                                {getRoleDisplayName(currentUser.role || '')}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-500">
                              {currentUser.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 캐시 잔액 */}
                      <div className="p-3 border-b border-gray-200 dark:border-coal-600">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-300">캐시 잔액</div>
                          <div className="flex items-center text-success dark:text-green-300 font-medium">
                            <KeenIcon icon="dollar" className="mr-1" />
                            {isLoading ? (
                              <span className="animate-pulse">로딩중...</span>
                            ) : (
                              new Intl.NumberFormat('ko-KR').format(cashBalance) + '원'
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="menu-item">
                    <Link to="/myinfo/profile" className="menu-link dark:hover:bg-coal-600">
                      <span className="menu-icon">
                        <KeenIcon icon="profile-circle" className="text-purple-500 dark:text-purple-400 !text-purple-500 dark:!text-purple-400" />
                      </span>
                      <span className="menu-title dark:text-white font-medium">내 정보 관리</span>
                    </Link>
                  </div>

                  <div className="menu-item">
                    <Link to="/cash/history" className="menu-link dark:hover:bg-coal-600">
                      <span className="menu-icon">
                        <KeenIcon icon="dollar" className="text-amber-500 dark:text-amber-400 !text-amber-500 dark:!text-amber-400" />
                      </span>
                      <span className="menu-title dark:text-white font-medium">캐시 내역</span>
                    </Link>
                  </div>

                  <div className="menu-item mb-0.5">
                    <div className="menu-link dark:hover:bg-coal-600">
                      <span className="menu-icon">
                        <KeenIcon icon="moon" className="text-indigo-500 dark:text-indigo-400 !text-indigo-500 dark:!text-indigo-400" />
                      </span>
                      <span className="menu-title dark:text-white font-medium">
                        다크 모드
                      </span>
                      <Switch
                        checked={settings.themeMode === 'dark'}
                        onCheckedChange={(checked) => {
                          const newThemeMode = checked ? 'dark' : 'light';
                          storeSettings({ themeMode: newThemeMode });
                        }}
                        className="bg-blue-500 data-[state=unchecked]:bg-gray-300"
                      />
                    </div>
                  </div>

                  <div className="menu-item border-t border-gray-200 dark:border-coal-600 mt-1 pt-1">
                    <button
                      className="menu-link dark:hover:bg-coal-600 text-red-600 dark:text-red-400 w-full text-left"
                      onClick={handleLogoutClick}
                      disabled={isLogoutLoading || isLoggingOut}
                    >
                      <span className="menu-icon">
                        <KeenIcon icon="exit-right" className="text-red-500 dark:text-red-400 !text-red-500 dark:!text-red-400 text-base" />
                      </span>
                      <span className="menu-title">
                        {isLogoutLoading || isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                      </span>
                    </button>
                  </div>
                </MenuSub>
              </MenuItem>
            </Menu>
          </div>

          {/* 로그아웃 버튼 (태블릿에서는 숨김) */}
          {!isTablet && (
            <>
              <div className="px-2 flex items-center h-9">
                <button
                  className="btn btn-icon btn-outline-danger dark:border-red-600 dark:text-red-400 transition-all hover:bg-danger dark:hover:bg-red-600 hover:text-white dark:hover:text-white w-9 h-9 rounded-full flex items-center justify-center"
                  onClick={handleLogoutClick}
                  title="로그아웃"
                  disabled={isLogoutLoading || isLoggingOut}
                >
                  {isLogoutLoading || isLoggingOut ? (
                    <span className="animate-spin text-sm">⊝</span>
                  ) : (
                    <KeenIcon icon="exit-right" className="text-base" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 캐시 충전 모달 */}
      <ChargeModal
        open={chargeModalOpen}
        onClose={() => setChargeModalOpen(false)}
      />
    </div>
  );
};

export { UserInfoDisplayV2 };