import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { useNotifications } from '@/hooks/useNotifications';
import {
  NotificationType,
  NotificationStatus,
  INotification,
  NotificationPriority
} from '@/types/notification';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import DeleteConfirmModal from '@/pages/admin/site/notification/components/DeleteConfirmModal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// '전체' 상태를 위한 타입 확장
type ExtendedStatus = NotificationStatus | 'all';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    markAllAsUnread,
    archiveNotification,
    deleteNotification,
    loading
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<ExtendedStatus>('all');
  const [activeType, setActiveType] = useState<NotificationType | 'all'>('all');
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [deleteMultiple, setDeleteMultiple] = useState<boolean>(false);

  // 필터링된 알림 목록
  const filteredNotifications = notifications.filter(notification => {
    const statusMatch = activeTab === 'all' || notification.status === activeTab;
    const typeMatch = activeType === 'all' || notification.type === activeType;
    return statusMatch && typeMatch;
  });

  // 날짜 포맷팅 - 모바일 화면을 위해 간소화
  const formatDate = (dateString: string | Date) => {
    try {
      if (!dateString) {
        return '날짜 정보 없음';
      }

      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const now = new Date();
      const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      // 오늘 날짜인 경우 시간만 표시
      if (isToday) {
        return format(date, 'HH:mm', { locale: ko });
      }

      // 같은 연도인 경우 연도 생략
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, 'MM/dd HH:mm', { locale: ko });
      }

      // 다른 연도인 경우 전체 날짜 표시 (간소화된 형식)
      return format(date, 'yy/MM/dd HH:mm', { locale: ko });
    } catch (error) {
      
      return '날짜 형식 오류';
    }
  };

  // 알림 타입 한글 변환
  const getNotificationTypeText = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return '시스템';
      case NotificationType.TRANSACTION:
        return '결제/캐시';
      case NotificationType.SERVICE:
        return '서비스';
      case NotificationType.SLOT:
        return '슬롯';
      case NotificationType.MARKETING:
        return '마케팅';
      default:
        return '기타';
    }
  };

  // 상태 텍스트 가져오기
  const getStatusText = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.UNREAD:
        return '읽지 않음';
      case NotificationStatus.READ:
        return '읽음';
      case NotificationStatus.ARCHIVED:
        return '보관됨';
      default:
        return '';
    }
  };

  return (
    <CommonTemplate
      title="알림 센터"
      description="중요한 알림을 확인하고 관리하세요"
      showPageMenu={false}
    >
      <div className="grid grid-cols-12 gap-6">
        {/* 왼쪽 사이드바 - 필터 (모바일에서는 상단 드롭다운으로 표시) */}
        <div className="col-span-12 md:col-span-2 md:block hidden">
          <div className="card rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-lg font-medium text-card-foreground">필터</h3>
            </div>

            <div className="p-4">
              <h4 className="text-sm font-medium mb-2 text-gray-500 uppercase">상태</h4>
              <div className="space-y-1">
                {/* 전체 상태 옵션 추가 */}
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveTab('all')}
                >
                  전체
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab === NotificationStatus.UNREAD ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveTab(NotificationStatus.UNREAD)}
                >
                  읽지 않음
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab === NotificationStatus.READ ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveTab(NotificationStatus.READ)}
                >
                  읽음
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeTab === NotificationStatus.ARCHIVED ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveTab(NotificationStatus.ARCHIVED)}
                >
                  보관됨
                </button>
              </div>

              <h4 className="text-sm font-medium mb-2 mt-4 text-gray-500 uppercase">유형</h4>
              <div className="space-y-1">
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeType === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveType('all')}
                >
                  전체
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeType === NotificationType.SYSTEM ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveType(NotificationType.SYSTEM)}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1.5"></span>
                  시스템
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeType === NotificationType.TRANSACTION ? 'bg-green-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveType(NotificationType.TRANSACTION)}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1.5"></span>
                  결제/캐시
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeType === NotificationType.SERVICE ? 'bg-purple-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveType(NotificationType.SERVICE)}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-600 mr-1.5"></span>
                  서비스
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeType === NotificationType.SLOT ? 'bg-orange-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveType(NotificationType.SLOT)}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-600 mr-1.5"></span>
                  슬롯
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${activeType === NotificationType.MARKETING ? 'bg-yellow-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setActiveType(NotificationType.MARKETING)}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-600 mr-1.5"></span>
                  마케팅
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일용 필터 드롭다운 */}
        <div className="col-span-12 md:hidden mb-4">
          <div className="flex flex-wrap gap-2">
            {/* 상태 필터 드롭다운 */}
            <div className="flex w-full flex-row items-center gap-2 sm:hidden">
              <select
                className="select select-sm select-bordered w-auto flex-1 min-w-0"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as ExtendedStatus)}
              >
                <option value="all">모든 알림</option>
                <option value={NotificationStatus.UNREAD}>읽지 않음</option>
                <option value={NotificationStatus.READ}>읽음</option>
                <option value={NotificationStatus.ARCHIVED}>보관됨</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <i className="ki-filled ki-down fs-7"></i>
              </div>

              {/* 유형 필터 드롭다운 */}
              <select
                className="select select-sm select-bordered w-auto flex-1 min-w-0"
                value={activeType}
                onChange={(e) => setActiveType(e.target.value as NotificationType | 'all')}
              >
                <option value="all">모든 유형</option>
                <option value={NotificationType.SYSTEM}>시스템</option>
                <option value={NotificationType.TRANSACTION}>결제/캐시</option>
                <option value={NotificationType.SERVICE}>서비스</option>
                <option value={NotificationType.SLOT}>슬롯</option>
                <option value={NotificationType.MARKETING}>마케팅</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <i className="ki-filled ki-down fs-7"></i>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 메인 콘텐츠 - 알림 목록 */}
        <div className="col-span-12 md:col-span-10">
          <div className="card rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 flex flex-col md:flex-row md:justify-between md:items-center border-b gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-card-foreground">
                  {activeTab === 'all' && '모든 알림'}
                  {activeTab === NotificationStatus.UNREAD && '읽지 않은 알림'}
                  {activeTab === NotificationStatus.READ && '읽은 알림'}
                  {activeTab === NotificationStatus.ARCHIVED && '보관된 알림'}
                  {activeType !== 'all' && ` - ${getNotificationTypeText(activeType)}`}
                </h3>
                {/* 선택된 개수 표시 - 알림 제목 바로 옆에 */}
                <span className={`text-sm text-gray-600 font-medium ${selectedNotifications.length === 0 ? 'hidden' : ''}`}>
                  {selectedNotifications.length}개 선택됨
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                <div className="flex items-center gap-2">
                  {/* 1. 전체 선택 버튼 - 주황색 계열 */}
                  <button
                    className={`btn btn-sm ${filteredNotifications.length > 0 && filteredNotifications.length !== selectedNotifications.length
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                      filteredNotifications.length > 0 && filteredNotifications.length === selectedNotifications.length
                        ? 'bg-orange-500 text-white' : 'bg-orange-200 text-orange-700 opacity-60 cursor-not-allowed'
                      }`}
                    onClick={() => {
                      // 표시된 알림이 없으면 동작하지 않음
                      if (filteredNotifications.length === 0) {
                        return;
                      }

                      // 모든 알림이 이미 선택된 상태라면 선택 해제, 아니라면 전체 선택
                      if (filteredNotifications.length === selectedNotifications.length) {
                        setSelectedNotifications([]);
                      } else {
                        // 현재 필터링된 모든 알림 ID를 선택
                        const allFilteredIds = filteredNotifications.map(n => n.id);
                        setSelectedNotifications(allFilteredIds);
                      }
                    }}
                    disabled={filteredNotifications.length === 0}
                  >
                    {filteredNotifications.length === selectedNotifications.length && selectedNotifications.length > 0
                      ? '전체 선택 해제'
                      : '전체 선택'}
                  </button>
                </div>

                {/* 2. 선택 해제 버튼 - 회색 계열 */}
                <button
                  className={`btn btn-sm ${selectedNotifications.length > 0
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-gray-200 text-gray-500 opacity-60 cursor-not-allowed'
                    }`}
                  onClick={() => {
                    // 선택된 알림이 없으면 동작하지 않음
                    if (selectedNotifications.length === 0) {
                      return;
                    }
                    // 모든 선택 해제
                    setSelectedNotifications([]);
                  }}
                  disabled={selectedNotifications.length === 0}
                >
                  선택 해제
                </button>

                {/* 액션 선택 드롭다운 */}
                {selectedNotifications.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <select
                      id="actionSelect"
                      className="select select-sm select-bordered w-auto flex-1 min-w-0"
                      defaultValue=""
                    >
                      <option value="" disabled>액션 선택</option>
                      <option value="read">읽음으로 표시</option>
                      <option value="unread">읽지 않음으로 표시</option>
                      <option value="archive">보관하기</option>
                      <option value="unarchive">보관 해제</option>
                      <option value="delete">삭제</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <i className="ki-filled ki-down fs-7"></i>
                    </div>

                    {/* 적용 버튼 */}
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        // 선택된 알림이 없으면 동작하지 않음
                        if (selectedNotifications.length === 0) {
                          return;
                        }

                        const actionSelect = document.getElementById('actionSelect') as HTMLSelectElement;
                        const selectedAction = actionSelect.value;

                        if (!selectedAction) return;

                        switch (selectedAction) {
                          case 'read':
                            // 읽음 처리
                            const unreadIds = notifications
                              .filter(n => selectedNotifications.includes(n.id) && n.status === NotificationStatus.UNREAD)
                              .map(n => n.id);
                            if (unreadIds.length > 0) {
                              markAllAsRead(unreadIds);
                            }
                            break;
                          case 'unread':
                            // 읽지 않음 처리
                            const readIds = notifications
                              .filter(n => selectedNotifications.includes(n.id) && n.status !== NotificationStatus.UNREAD)
                              .map(n => n.id);
                            if (readIds.length > 0) {
                              markAllAsUnread(readIds);
                            }
                            break;
                          case 'archive':
                            // 보관 처리
                            selectedNotifications.forEach(id => {
                              archiveNotification(id);
                            });
                            break;
                          case 'unarchive':
                            // 보관 해제 처리 (읽음 상태로 변경)
                            selectedNotifications.forEach(id => {
                              markAsRead(id);
                            });
                            break;
                          case 'delete':
                            // 삭제 확인 모달 표시
                            setDeleteMultiple(true);
                            setShowDeleteConfirm(true);
                            break;
                        }

                        // 액션 완료 후 select 초기화
                        actionSelect.value = "";

                        // 삭제가 아닌 경우 선택 목록 초기화
                        if (selectedAction !== 'delete') {
                          setSelectedNotifications([]);
                        }
                      }}
                    >
                      적용
                    </button>
                  </div>
                )}

                {/* 5. 모두 읽음 버튼 - 파란색 계열, 모바일에서는 아이콘만 */}
                <button
                  className={`btn btn-sm ml-auto ${filteredNotifications.some(notification => notification.status === NotificationStatus.UNREAD)
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-200 text-blue-700 opacity-60 cursor-not-allowed'
                    }`}
                  onClick={() => {
                    // 읽지 않은 알림이 없으면 동작하지 않음
                    if (!filteredNotifications.some(notification => notification.status === NotificationStatus.UNREAD)) {
                      return;
                    }

                    // 활성화된 타입에 따라 해당 유형의 알림만 읽음 처리
                    if (activeType !== 'all') {
                      const unreadTypeNotifications = notifications
                        .filter(n => n.status === NotificationStatus.UNREAD && n.type === activeType)
                        .map(n => n.id);

                      if (unreadTypeNotifications.length > 0) {
                        // 해당 유형의.읽지 않은 알림 ID 목록 전달
                        markAllAsRead(unreadTypeNotifications);
                      }
                    } else {
                      // 전체 읽음 처리
                      markAllAsRead();
                    }
                  }}
                  disabled={!filteredNotifications.some(notification => notification.status === NotificationStatus.UNREAD)}
                  title="모두 읽음으로 표시"
                >
                  모두 읽음
                </button>
              </div>
            </div>

            <div className="space-y-2 p-2">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="flex justify-center items-center space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <div className="mt-2">알림을 불러오는 중...</div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {activeTab === 'all' && '알림이 없습니다.'}
                  {activeTab === NotificationStatus.UNREAD && '읽지 않은 알림이 없습니다.'}
                  {activeTab === NotificationStatus.READ && '읽은 알림이 없습니다.'}
                  {activeTab === NotificationStatus.ARCHIVED && '보관된 알림이 없습니다.'}
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-5 hover:bg-gray-50 transition-all duration-200 ${selectedNotifications.includes(notification.id)
                      ? 'border border-primary rounded-lg shadow-sm pl-6 my-2'
                      : 'border border-transparent'
                      }`}
                  >
                    <div className="flex gap-4 items-center">
                      {/* 둥근 아이콘 (기존처럼 왼쪽에 배치, 크기 확대 및 세로 중앙 정렬) */}
                      <div className="relative self-center">
                        <div
                          className={`
                            w-14 h-14 rounded-full flex items-center justify-center cursor-pointer
                            ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-primary ring-offset-2' : ''}
                            ${notification.type === NotificationType.SYSTEM && 'bg-blue-100 text-blue-600'}
                            ${notification.type === NotificationType.TRANSACTION && 'bg-green-100 text-green-600'}
                            ${notification.type === NotificationType.SERVICE && 'bg-purple-100 text-purple-600'}
                            ${notification.type === NotificationType.SLOT && 'bg-orange-100 text-orange-600'}
                            ${notification.type === NotificationType.MARKETING && 'bg-yellow-100 text-yellow-600'}
                          `}
                          onClick={() => {
                            if (selectedNotifications.includes(notification.id)) {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            } else {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            }
                          }}
                        >
                          {/* 원래 알림 타입 아이콘은 항상 표시 (크기 증가) */}
                          <i className={`ki-${notification.type === NotificationType.SYSTEM ? 'info-circle' :
                            notification.type === NotificationType.TRANSACTION ? 'dollar' :
                              notification.type === NotificationType.SERVICE ? 'setting-2' :
                                notification.type === NotificationType.SLOT ? 'cube-2' :
                                  'percentage-circle'
                            } fs-2`}></i>
                        </div>

                        {/* 중요도 표시 - 고중요도는 아이콘 표시 (위치 조정) */}
                        {notification.priority === NotificationPriority.HIGH && (
                          <div className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                            <i className="ki-notification-bing text-xs"></i>
                          </div>
                        )}

                        {/* 선택 시 체크 아이콘 오버레이 (위치 조정) */}
                        {selectedNotifications.includes(notification.id) && (
                          <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                            <i className="ki-check text-xs"></i>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-grow">
                        {/* 제목과 액션 버튼을 같은 라인에 배치 */}
                        <div className="flex justify-between items-center mb-2 gap-2">
                          {/* 제목 */}
                          <div
                            className="cursor-pointer flex-grow"
                            onClick={() => {
                              // 알림 선택/해제 토글
                              if (selectedNotifications.includes(notification.id)) {
                                setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                              } else {
                                setSelectedNotifications(prev => [...prev, notification.id]);
                              }
                            }}
                          >
                            <h4
                              className="font-medium text-lg hover:text-primary hover:underline cursor-pointer truncate pr-2"
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 전파 중단
                                setSelectedNotification(notification);
                                if (notification.status === NotificationStatus.UNREAD) {
                                  markAsRead(notification.id);
                                }
                              }}
                            >
                              {notification.title}
                            </h4>
                          </div>

                          {/* 알림 액션 버튼 */}
                          <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* 읽지 않은 알림에 대한 읽음 표시 버튼 */}
                            {notification.status === NotificationStatus.UNREAD && (
                              <button
                                className="text-primary hover:text-primary-dark"
                                onClick={() => markAsRead(notification.id)}
                                title="읽음 표시"
                              >
                                <i className="ki-filled ki-check-square fs-5"></i>
                              </button>
                            )}

                            {/* 보관 버튼 (보관됨 상태가 아닌 경우에만 표시) */}
                            {notification.status !== NotificationStatus.ARCHIVED ? (
                              <button
                                className="text-purple-500 hover:text-purple-700"
                                onClick={() => archiveNotification(notification.id)}
                                title="보관하기"
                              >
                                <i className="ki-filled ki-archive fs-5"></i>
                              </button>
                            ) : (
                              <button
                                className="text-purple-500 hover:text-purple-700"
                                onClick={() => markAsRead(notification.id)}
                                title="보관 해제"
                              >
                                <i className="ki-filled ki-archive-out fs-5"></i>
                              </button>
                            )}

                            {/* 삭제 버튼 */}
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                setNotificationToDelete(notification.id);
                                setDeleteMultiple(false);
                                setShowDeleteConfirm(true);
                              }}
                              title="삭제"
                            >
                              <i className="ki-filled ki-trash fs-5"></i>
                            </button>
                          </div>
                        </div>

                        {/* 3열: 배지 표시 */}
                        <div className="flex flex-wrap gap-2 mb-2 h-7">
                          {/* 유형 배지 */}
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 h-6 ${notification.type === NotificationType.SYSTEM
                            ? 'bg-blue-100 text-blue-700'
                            : notification.type === NotificationType.TRANSACTION
                              ? 'bg-green-100 text-green-700'
                              : notification.type === NotificationType.SERVICE
                                ? 'bg-purple-100 text-purple-700'
                                : notification.type === NotificationType.SLOT
                                  ? 'bg-orange-100 text-orange-700'
                                  : notification.type === NotificationType.MARKETING
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                            <span className={`inline-block w-2 h-2 rounded-full ${notification.type === NotificationType.SYSTEM
                              ? 'bg-blue-500'
                              : notification.type === NotificationType.TRANSACTION
                                ? 'bg-green-500'
                                : notification.type === NotificationType.SERVICE
                                  ? 'bg-purple-500'
                                  : notification.type === NotificationType.SLOT
                                    ? 'bg-orange-500'
                                    : notification.type === NotificationType.MARKETING
                                      ? 'bg-yellow-500'
                                      : 'bg-gray-500'
                              }`}></span>
                            {getNotificationTypeText(notification.type)}
                          </span>

                          {/* 전체 상태에서는 읽음/안읽음 상태 표시 */}
                          {activeTab === 'all' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full h-6 flex items-center ${notification.status === NotificationStatus.UNREAD
                              ? 'bg-blue-50 text-blue-600'
                              : notification.status === NotificationStatus.ARCHIVED
                                ? 'bg-purple-50 text-purple-600'
                                : 'bg-gray-50 text-gray-500'
                              }`}>
                              {getStatusText(notification.status)}
                            </span>
                          )}

                          {/* 중요도 배지 */}
                          {notification.priority === NotificationPriority.HIGH && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 h-6">
                              <span className="mr-1 flex-shrink-0">
                                <i className="ki-filled ki-notification-bing fs-8"></i>
                              </span>
                              중요
                            </span>
                          )}
                          {notification.priority === NotificationPriority.MEDIUM && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 h-6">
                              <span className="mr-1 flex-shrink-0">
                                <i className="ki-filled ki-notification fs-8"></i>
                              </span>
                              중간
                            </span>
                          )}
                        </div>

                        {/* 알림 내용 */}
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            // 알림 선택/해제 토글
                            if (selectedNotifications.includes(notification.id)) {
                              setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                            } else {
                              setSelectedNotifications(prev => [...prev, notification.id]);
                            }
                          }}
                        >
                          <p className="text-gray-600 mb-2 line-clamp-2 md:line-clamp-none text-sm">{notification.message}</p>

                          {/* 액션 버튼 영역 */}
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                className="text-primary hover:underline text-sm inline-block"
                                onClick={(e) => {
                                  e.stopPropagation(); // 이벤트 전파 중단
                                  e.preventDefault();
                                  setSelectedNotification(notification);
                                  if (notification.status === NotificationStatus.UNREAD) {
                                    markAsRead(notification.id);
                                  }
                                }}
                              >
                                자세히 보기
                              </button>

                              {/* 링크가 있으면 링크 액션 버튼으로 표시 */}
                              {notification.link && (
                                <button
                                  className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation(); // 이벤트 전파 중단
                                    
                                    // 읽지 않은 알림이면 읽음 처리
                                    if (notification.status === NotificationStatus.UNREAD) {
                                      markAsRead(notification.id);
                                    }
                                    
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
                                  }}
                                >
                                  <i className="ki-filled ki-arrow-right fs-7 mr-1"></i>
                                  바로가기
                                </button>
                              )}
                            </div>

                            {/* 날짜 표시 - 자세히 보기 행으로 이동하고 우측 정렬 */}
                            <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 알림 상세 모달 */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={async (id: string) => await markAsRead(id)}
          onArchive={archiveNotification}
          onDelete={async (id) => {
            setNotificationToDelete(id);
            setDeleteMultiple(false);
            setShowDeleteConfirm(true);
            setSelectedNotification(null);
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (deleteMultiple) {
            // 선택된 알림 모두 삭제 처리
            selectedNotifications.forEach(id => {
              deleteNotification(id);
            });
            // 선택 목록 초기화
            setSelectedNotifications([]);
          } else if (notificationToDelete) {
            // 단일 알림 삭제
            deleteNotification(notificationToDelete);
            setNotificationToDelete(null);
          }
          setShowDeleteConfirm(false);
        }}
        title={deleteMultiple ? '선택한 알림 삭제' : '알림 삭제'}
        message={deleteMultiple
          ? `선택한 ${selectedNotifications.length}개의 알림을 정말 삭제하시겠습니까?`
          : '이 알림을 정말 삭제하시겠습니까?'}
      />
    </CommonTemplate>
  );
};

export default NotificationsPage;