import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/auth';
import { NotificationPriority, NotificationType, NotificationStatus } from '@/types/notification';
import { toast } from 'sonner';
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

  // 관리자 권한 체크
  const isAdmin = currentUser?.role === 'developer' || currentUser?.role === 'operator';

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
    useFallback: statsUseFallback
  } = useNotificationStats({
    refreshInterval: 60000, // 1분마다 갱신
    autoRefresh: true,
    fallbackToOldMethod: true // 테이블 오류 시 기존 방식으로 폴백
  });

  // 테이블 존재 확인
  const [tableStatus, setTableStatus] = useState({ exists: false, checked: false });

  // 페이지 로드 시 테이블 존재 여부 확인
  useEffect(() => {
    async function checkTable() {
      try {
        // 개발자 권한을 가진 경우에만 실행
        if (currentUser?.role === 'developer' || currentUser?.role === 'operator') {
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
      toast.success('알림이 성공적으로 전송되었습니다.');
      setIsOpenSendModal(false);
      setSelectedUsers([]);

      // 알림 생성 후 통계 갱신
      setTimeout(() => {
        refreshStats();
      }, 1000);
    } else {
      toast.error('알림 전송에 실패했습니다. 다시 시도해주세요.');
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
      toast.success('알림이 성공적으로 삭제되었습니다.');

      // 알림 삭제 후 통계 갱신
      setTimeout(() => {
        refreshStats();
      }, 1000);
    } else {
      toast.error('알림 삭제에 실패했습니다. 다시 시도해주세요.');
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
      >
        <KeenIcon icon="briefcase" className="me-2" />
        권한별 알림 전송
      </button>
      <button
        className="btn btn-info"
        onClick={() => handleOpenSendModal('user')}
      >
        <KeenIcon icon="user" className="me-2" />
        회원별 알림 전송
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
        <div className="grid gap-5 lg:gap-7.5">
          {/* 상단 영역: 통계와 버튼 */}
          <div className="bg-card rounded-lg shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                {statsLastUpdated && (
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      통계 갱신: {statsLastUpdated.toLocaleString()}
                      {statsUseFallback && (
                        <span className="ml-1 text-amber-500">(기본 모드)</span>
                      )}
                      {tableStatus.checked && (
                        <span className={`ml-1 ${tableStatus.exists ? 'text-green-500' : 'text-red-500'}`}>
                          {tableStatus.exists ? '(테이블 확인됨)' : '(테이블 없음)'}
                        </span>
                      )}
                      <button
                        className="ml-2 text-primary hover:bg-primary-light dark:hover:bg-primary-dark/50 p-1 rounded transition-colors"
                        onClick={async () => {
                          await refreshStats();
                        }}
                        title="통계 갱신"
                      >
                        <KeenIcon icon="arrows-circle" className="w-5 h-5" />
                      </button>

                      {/* 관리자 전용 메뉴 - 통계 테이블 리셋 */}
                      {(currentUser?.role === 'developer') && (
                        <button
                          className="ml-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                          onClick={async () => {
                            try {
                              // 통계 테이블 초기화 작업
                              const { supabaseAdmin } = await import('@/supabase');

                              // 부모 컴포넌트에서 직접 초기화 작업 수행
                              toast.loading('통계 초기화 중...');

                              try {
                                // 현재 통계 테이블 확인
                                const { data, error } = await supabaseAdmin
                                  .from('notification_aggregates')
                                  .select('id')
                                  .limit(1);

                                if (error && error.message.includes('does not exist')) {
                                  toast.dismiss();
                                  toast.error('통계 테이블이 존재하지 않습니다. SQL을 먼저 실행해주세요.');
                                  return;
                                }

                                // 테이블이 있으면 통계 갱신
                                await refreshStats();
                                toast.dismiss();
                                toast.success('통계가 성공적으로 초기화되었습니다.');

                                // 테이블 상태 업데이트
                                setTableStatus({ exists: true, checked: true });
                              } catch (error) {
                                console.error('테이블 초기화 중 오류:', error);
                                toast.dismiss();
                                toast.error('통계 초기화 중 오류가 발생했습니다.');
                              }
                            } catch (error) {
                              console.error('모듈 로드 오류:', error);
                              toast.error('초기화 작업을 수행할 수 없습니다.');
                            }
                          }}
                          title="통계 테이블 초기화 (개발자 전용)"
                        >
                          <KeenIcon icon="setting-2" className="w-5 h-5" />
                        </button>
                      )}
                    </span>
                  </div>
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
              <div className="w-full sm:w-auto">
                <NotificationFilter
                  filterType={filterType}
                  filterUserRole={filterUserRole}
                  onFilterTypeChange={handleFilterTypeChange}
                  onFilterUserRoleChange={handleFilterUserRoleChange}
                  onApplyFilter={handleApplyFilter}
                />
              </div>

              <div className="w-full sm:w-auto flex justify-end">
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

            {/* 상단 페이지네이션 */}
            <NotificationPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />

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
            <NotificationPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>

          {/* 설명 영역 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">알림 관리 안내</h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
              <p>• <span className="font-medium text-gray-800 dark:text-gray-100">권한별 알림 전송</span>: 개발자, 운영자, 총판, 대행사, 광고주 등 특정 권한을 가진 모든 회원에게 알림을 전송합니다.</p>
              <p>• <span className="font-medium text-gray-800 dark:text-gray-100">회원별 알림 전송</span>: 특정 회원을 선택하여 알림을 전송합니다.</p>
              <p>• <span className="font-medium text-gray-800 dark:text-gray-100">알림 삭제 기능</span>: 테이블 용량 관리를 위해 특정 기간이 지난 알림을 일괄 삭제할 수 있습니다.</p>
              <p>• <span className="font-medium text-gray-800 dark:text-gray-100">알림 타입</span>: 시스템, 결제/캐시, 서비스, 슬롯, 마케팅 등 다양한 유형의 알림을 전송할 수 있습니다.</p>
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