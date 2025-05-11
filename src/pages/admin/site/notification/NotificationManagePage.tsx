import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import { NotificationPriority, NotificationType, NotificationStatus } from '@/types/notification';
import { USER_ROLES, PERMISSION_GROUPS, hasPermission } from '@/config/roles.config';
import { useToast } from '@/providers/ToastProvider';
// 테이블 확인 유틸리티 추가 - 이제 TypeScript 파일
import { checkNotificationAggregatesTable } from './utils/check-table';
import SendNotificationModal from './components/SendNotificationModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import UserSelectModal from './components/UserSelectModal';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components/keenicons';
import { ScreenLoader } from '@/components/loaders';
import { useNotifications } from './hooks/useNotifications';
import { useNotificationStats } from './hooks/useNotificationStats';
import NotificationFilter from './components/NotificationFilter';
import NotificationActions from './components/NotificationActions';
import NotificationTable from './components/NotificationTable';
import NotificationPagination from './components/NotificationPagination';
import NotificationStatsWrapper from './components/NotificationStatsWrapper';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 파일 확장자를 포함하지 않도록 수정
// 통계 초기화 기능은 통계 갱신 버튼 클릭으로 대체

const NotificationManagePage: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuthContext();

  // 커스텀 알림 토스트 상태
  const [notificationToast, setNotificationToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const toast = useToast();

  // 관리자 권한 체크
  const isAdmin = currentUser?.role ? hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN) : false;

  // 알림 목록 커스텀 훅 사용
  const {
    notifications,
    loading,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    filterType,
    filterUserRole,
    selectedItems,
    handlePageChange,
    handleItemsPerPageChange,
    handleApplyFilter,
    handleFilterTypeChange,
    handleFilterUserRoleChange,
    handleSelectionChange,
    handleSelectAll,
    deleteNotificationsHandler,
    createNotificationsHandler,
    refreshNotifications
  } = useNotifications({ isAdmin });

  // 알림 통계 커스텀 훅 사용 (백그라운드 갱신)
  const {
    stats,
    loading: statsLoading,
    lastUpdated: statsLastUpdated,
    refreshStats,
    useFallback: statsUseFallback,
    notification: statsNotification, // 통계 관련 알림 상태
    setNotification: setStatsNotification // 통계 알림 설정 함수
  } = useNotificationStats({
    refreshInterval: 60000, // 1분마다 갱신
    autoRefresh: true,
    fallbackToOldMethod: true // 테이블 오류 시 기존 방식으로 폴백
  });

  // 테이블 존재 확인
  const [tableStatus, setTableStatus] = useState({ exists: false, checked: false });

  // 알림 자동 사라짐 처리
  useEffect(() => {
    if (notificationToast.show) {
      const timer = setTimeout(() => {
        setNotificationToast({ ...notificationToast, show: false });
      }, 5000); // 5초 후 자동으로 닫힘

      return () => clearTimeout(timer);
    }
  }, [notificationToast.show, notificationToast.message]);

  // 통계 알림 자동 사라짐 처리

  // 커스텀 토스트를 사용하므로 자동 사라짐 처리는 필요 없음

  // 통계 알림 처리 - 커스텀 토스트로 변환

  useEffect(() => {
    if (statsNotification?.show) {
      if (statsNotification.type === 'success') {
        toast.success(statsNotification.message);
      } else if (statsNotification.type === 'error') {
        toast.error(statsNotification.message);
      }

      // 통계 알림 상태 초기화
      setStatsNotification({ ...statsNotification, show: false });
    }
  }, [statsNotification?.show, statsNotification?.message, toast]);

  // 페이지 로드 시 테이블 존재 여부 확인
  useEffect(() => {
    async function checkTable() {
      try {
        // 관리자 권한을 가진 경우에만 실행
        if (currentUser?.role && hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
          const result = await checkNotificationAggregatesTable();
          setTableStatus({ exists: result.exists, checked: true });

          // 개발자에게 결과 알림
          if (result.exists) {

            // 테이블이 있지만 폴백 모드라면 통계 갱신 시도
            if (statsUseFallback) {
              setTimeout(() => refreshStats(), 1000);
            }
          } else {
            console.warn('⚠️ notification_aggregates 테이블이 존재하지 않습니다!');
          }
        }
      } catch (error) {
        console.error('테이블 확인 중 오류 발생:', error);
      }
    }

    checkTable();
  }, [currentUser?.role, statsUseFallback, refreshStats]);

  // 모달 상태
  const [isOpenSendModal, setIsOpenSendModal] = useState(false);
  const [isOpenUserSelectModal, setIsOpenUserSelectModal] = useState(false);
  const [isOpenDeleteConfirmModal, setIsOpenDeleteConfirmModal] = useState(false);
  const [selectedNotificationType, setSelectedNotificationType] = useState<'role' | 'user'>('role');
  const [deleteOption, setDeleteOption] = useState<{
    type: 'selected' | 'older' | 'all';
    ids?: string[];
    olderThan?: Date;
  } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string, name: string }[]>([]);

  // 알림 전송 모달 열기 핸들러
  const handleOpenSendModal = (type: 'role' | 'user') => {
    setSelectedNotificationType(type);

    if (type === 'user') {
      setIsOpenUserSelectModal(true);
    } else {
      setIsOpenSendModal(true);
    }
  };

  // 사용자 선택 완료 핸들러
  const handleUserSelectComplete = (users: { id: string, name: string }[]) => {
    setSelectedUsers(users);
    setIsOpenUserSelectModal(false);
    setIsOpenSendModal(true);
  };

  // 알림 전송 처리 핸들러
  const handleSendNotification = async (notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    link?: string;
    icon?: string;
    expiresAt?: Date | string;
    status: NotificationStatus;
  }) => {
    let success = false;

    if (selectedNotificationType === 'role') {
      // 역할별 알림 전송
      const selectedRole = document.getElementById('targetRole') as HTMLSelectElement;
      if (!selectedRole?.value) return;

      success = await createNotificationsHandler({
        notificationData: notificationData,
        target: { type: 'role', value: selectedRole.value === 'all' ? 'all' : selectedRole.value }
      });
    } else if (selectedNotificationType === 'user') {
      // 특정 사용자에게 알림 전송
      if (selectedUsers.length === 0) return;

      success = await createNotificationsHandler({
        notificationData: notificationData,
        target: { type: 'user', value: selectedUsers.map(user => user.id) }
      });
    }

    if (success) {
      setNotificationToast({
        show: true,
        message: '알림이 성공적으로 전송되었습니다.',
        type: 'success'
      });
      setIsOpenSendModal(false);
      setSelectedUsers([]);

      // 알림 생성 후 통계 갱신
      setTimeout(() => {
        refreshStats();
      }, 1000);
    } else {
      setNotificationToast({
        show: true,
        message: '알림 전송에 실패했습니다. 다시 시도해주세요.',
        type: 'error'
      });
    }
  };

  // 알림 삭제 확인 모달 열기 핸들러
  const handleOpenDeleteConfirmModal = (option: {
    type: 'selected' | 'older' | 'all';
    ids?: string[];
    olderThan?: Date;
  }) => {
    setDeleteOption(option);
    setIsOpenDeleteConfirmModal(true);
  };

  // 알림 삭제 실행 핸들러
  const handleDeleteConfirmed = async () => {
    if (!deleteOption) return;

    const success = await deleteNotificationsHandler(deleteOption);
    if (success) {
      setNotificationToast({
        show: true,
        message: '알림이 성공적으로 삭제되었습니다.',
        type: 'success'
      });

      // 알림 삭제 후 통계 갱신
      setTimeout(() => {
        refreshStats();
      }, 1000);
    } else {
      setNotificationToast({
        show: true,
        message: '알림 삭제에 실패했습니다. 다시 시도해주세요.',
        type: 'error'
      });
    }

    setIsOpenDeleteConfirmModal(false);
    setDeleteOption(null);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch (error) {
      return '날짜 없음';
    }
  };

  // 관리자 권한 체크 및 로딩 화면
  if (authLoading) {
    return <ScreenLoader />;
  }

  // 관리자가 아니면 메인 페이지로 리디렉션
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 툴바 액션 버튼
  const toolbarActions = (
    <div className="flex gap-3">
      <button
        className="btn btn-primary"
        onClick={() => handleOpenSendModal('role')}
        title="권한별 알림 전송"
      >
        <KeenIcon icon="briefcase" className="md:me-2 flex-none" />
        <span className="hidden md:inline">권한별 알림 전송</span>
      </button>
      <button
        className="btn btn-info"
        onClick={() => handleOpenSendModal('user')}
        title="회원별 알림 전송"
      >
        <KeenIcon icon="user" className="md:me-2 flex-none" />
        <span className="hidden md:inline">회원별 알림 전송</span>
      </button>
    </div>
  );

  return (
    <>
      <CommonTemplate
        title="알림 관리"
        description="관리자 메뉴 > 사이트 관리 > 알림 관리"
        toolbarActions={toolbarActions}
        showPageMenu={false}
      >
        {/* 알림 메시지 - 커스텀 토스트 */}
        {notificationToast.show && (
          <div
            className={`fixed top-5 left-5 sm:left-auto sm:right-5 z-50 p-3 md:p-4 rounded-lg shadow-lg transition-all duration-300 transform w-[calc(100%-40px)] sm:w-auto max-w-sm ${
              notificationToast.type === 'success'
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500 dark:bg-green-950/50 dark:text-green-300 dark:border-green-600'
                : 'bg-red-50 text-red-700 border-l-4 border-red-500 dark:bg-red-950/50 dark:text-red-300 dark:border-red-600'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notificationToast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-grow">
                <p className="text-sm font-medium truncate">{notificationToast.message}</p>
              </div>
              <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-muted/60 flex-shrink-0"
                onClick={() => setNotificationToast({ ...notificationToast, show: false })}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 통계 알림 메시지 - 커스텀 토스트 */}
        {statsNotification?.show && (
          <div
            className={`fixed top-20 left-5 sm:left-auto sm:right-5 z-50 p-3 md:p-4 rounded-lg shadow-lg transition-all duration-300 transform w-[calc(100%-40px)] sm:w-auto max-w-sm ${
              statsNotification.type === 'success' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500 dark:bg-green-950/50 dark:text-green-300 dark:border-green-600'
                : 'bg-red-50 text-red-700 border-l-4 border-red-500 dark:bg-red-950/50 dark:text-red-300 dark:border-red-600'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {statsNotification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-grow">
                <p className="text-sm font-medium truncate">{statsNotification.message}</p>
              </div>
              <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-muted/60 flex-shrink-0"
                onClick={() => setStatsNotification({ ...statsNotification, show: false })}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          {/* 상단 영역: 통계와 버튼 */}
          <div className="bg-card rounded-lg shadow-sm p-5">
            <div className="flex flex-row justify-between items-center mb-6">
              {statsLastUpdated && (
                <div className="flex items-center">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center whitespace-nowrap">
                      <span className="hidden md:inline">통계 갱신:</span>
                      <span className="md:hidden inline-flex items-center">
                        <KeenIcon icon="time" className="w-4 h-4 mr-1" />
                      </span>
                      <span className="font-medium text-foreground text-xs sm:text-sm">{statsLastUpdated.toLocaleString()}</span>
                    </div>

                    {/* 테이블 상태 표시 */}
                    <div className="flex items-center gap-1 ml-1">
                      {statsUseFallback && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          기본모드
                        </span>
                      )}
                      {tableStatus.checked && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded ${
                          tableStatus.exists 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {tableStatus.exists ? 'OK' : '없음'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 버튼 그룹 - 우측 정렬 */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  className="inline-flex items-center justify-center text-primary hover:bg-primary-light dark:hover:bg-primary-dark/50 p-2 rounded transition-colors"
                  onClick={async () => {
                    await refreshStats();
                  }}
                  title="통계 갱신"
                >
                  <KeenIcon icon="arrows-circle" className="w-5 h-5" />
                </button>

                {/* 개발자 전용 메뉴 - 통계 테이블 리셋 */}
                {(currentUser?.role === USER_ROLES.DEVELOPER) && (
                  <button
                    className="inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                    onClick={async () => {
                      try {
                        // 통계 테이블 초기화 작업
                        const { supabaseAdmin } = await import('@/supabase');

                        // 부모 컴포넌트에서 직접 초기화 작업 수행
                        setStatsNotification({ 
                          show: true, 
                          message: '통계 초기화 중...', 
                          type: 'success'
                        });

                        try {
                          // 현재 통계 테이블 확인
                          const { data, error } = await supabaseAdmin
                            .from('notification_aggregates')
                            .select('id')
                            .limit(1);

                          if (error && error.message.includes('does not exist')) {
                            setStatsNotification({ 
                              show: true, 
                              message: '통계 테이블이 존재하지 않습니다.', 
                              type: 'error'
                            });
                            return;
                          }

                          // 테이블이 있으면 통계 갱신
                          await refreshStats();
                          setStatsNotification({ 
                            show: true, 
                            message: '통계가 성공적으로 초기화되었습니다.', 
                            type: 'success'
                          });

                          // 테이블 상태 업데이트
                          setTableStatus({ exists: true, checked: true });
                        } catch (error) {
                          console.error('테이블 초기화 중 오류:', error);
                          setStatsNotification({ 
                            show: true, 
                            message: '통계 초기화 중 오류가 발생했습니다.', 
                            type: 'error'
                          });
                        }
                      } catch (error) {
                        console.error('모듈 로드 오류:', error);
                        setStatsNotification({ 
                          show: true, 
                          message: '초기화 작업을 수행할 수 없습니다.', 
                          type: 'error'
                        });
                      }
                    }}
                    title="통계 테이블 초기화 (개발자 전용)"
                  >
                    <KeenIcon icon="setting-2" className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* 알림 통계 카드 */}
            <NotificationStatsWrapper
              stats={stats}
              lastUpdated={statsLastUpdated}
              useFallback={statsUseFallback}
            />
          </div>

          {/* 알림 관리 카드 영역 */}
          <div className="card shadow-sm overflow-hidden border border-border rounded-lg">
            {/* 필터 및 삭제 액션 */}
            <div className="card-header p-6 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border-b border-border">
              <div className="w-full sm:w-auto order-1 sm:order-1">
                <NotificationFilter
                  filterType={filterType}
                  filterUserRole={filterUserRole}
                  onFilterTypeChange={handleFilterTypeChange}
                  onFilterUserRoleChange={handleFilterUserRoleChange}
                  onApplyFilter={handleApplyFilter}
                />
              </div>

              <div className="w-full sm:w-auto flex justify-end order-2 sm:order-2 self-end">
                <NotificationActions
                  selectedItemsCount={selectedItems.length}
                  onDeleteSelected={() => handleOpenDeleteConfirmModal({
                    type: 'selected',
                    ids: selectedItems
                  })}
                  onDeleteOlderThan30Days={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 30); // 30일 이전
                    handleOpenDeleteConfirmModal({
                      type: 'older',
                      olderThan: date
                    });
                  }}
                  onDeleteAll={() => handleOpenDeleteConfirmModal({ type: 'all' })}
                />
              </div>
            </div>

            {/* 상단 페이지네이션 - 모바일에서는 숨김 */}
            <div className="hidden md:block">
              <NotificationPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>

            {/* 알림 목록 테이블 */}
            <div className="overflow-hidden">
              <NotificationTable
                notifications={notifications}
                loading={loading}
                selectedItems={selectedItems}
                onSelectionChange={handleSelectionChange}
                onSelectAll={handleSelectAll}
                onDeleteSingle={(id) => handleOpenDeleteConfirmModal({
                  type: 'selected',
                  ids: [id]
                })}
              />
            </div>

            {/* 하단 페이지네이션 */}
            <div className="block">
              <NotificationPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>

          {/* 설명 영역 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">알림 관리 안내</h3>
            <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p>• <span className="font-medium text-blue-900 dark:text-blue-100">권한별 알림</span>: 특정 권한의 모든 회원에게 전송</p>
                <p>• <span className="font-medium text-blue-900 dark:text-blue-100">회원별 알림</span>: 특정 회원을 선택하여 전송</p>
                <p>• <span className="font-medium text-blue-900 dark:text-blue-100">알림 삭제</span>: 테이블 용량 관리를 위한 삭제 기능</p>
                <p>• <span className="font-medium text-blue-900 dark:text-blue-100">알림 타입</span>: 시스템, 결제, 서비스, 마케팅 등</p>
              </div>
            </div>
          </div>
        </div>
      </CommonTemplate>

      {/* 모달 컴포넌트들 - Dialog 방식으로 변경 */}
      <SendNotificationModal
        isOpen={isOpenSendModal}
        onClose={() => {
          setIsOpenSendModal(false);
          setSelectedUsers([]);
        }}
        onSend={handleSendNotification}
        notificationType={selectedNotificationType}
        selectedUsers={selectedUsers}
      />

      <UserSelectModal
        isOpen={isOpenUserSelectModal}
        onClose={() => setIsOpenUserSelectModal(false)}
        onSelectComplete={handleUserSelectComplete}
      />

      {deleteOption && (
        <DeleteConfirmModal
          isOpen={isOpenDeleteConfirmModal}
          onClose={() => {
            setIsOpenDeleteConfirmModal(false);
            setDeleteOption(null);
          }}
          onConfirm={handleDeleteConfirmed}
          title={
            deleteOption.type === 'selected'
              ? '선택한 알림 삭제'
              : deleteOption.type === 'older'
                ? '오래된 알림 삭제'
                : '전체 알림 삭제'
          }
          message={
            deleteOption.type === 'selected'
              ? `선택한 ${deleteOption.ids?.length || 0}개의 알림을 삭제하시겠습니까?`
              : deleteOption.type === 'older'
                ? `${formatDate(deleteOption.olderThan || new Date())} 이전의 모든 알림을 삭제하시겠습니까?`
                : '모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
          }
        />
      )}
    </>
  );
};

export default NotificationManagePage;