import React from 'react';
import { useNavigate } from 'react-router-dom';
import { INotification, NotificationType, NotificationPriority } from '@/types/notification';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import NotificationIcon from './NotificationIcon';
import { KeenIcon } from '@/components/keenicons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/providers';
import { useDialog } from '@/components/dialog';

// 모달용 스타일을 추가합니다
const modalStyles = `
  .notification-modal-content {
    position: fixed !important;
    z-index: 9999 !important;
    max-width: 500px !important;
    width: 95% !important;
    margin: 0 auto !important;
    overflow: visible !important;
  }
  
  .notification-modal-overlay {
    position: fixed !important;
    z-index: 9998 !important;
    inset: 0 !important;
  }
`;

interface NotificationDetailModalProps {
  notification: INotification;
  open?: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  open = true,
  onClose,
  onMarkAsRead,
  onArchive,
  onDelete
}) => {
  const navigate = useNavigate(); // React Router 네비게이션 훅
  const toast = useToast(); // 토스트 메시지 훅
  const { showConfirm } = useDialog(); // 다이얼로그 훅
  // 날짜 포맷팅
  const formatDate = (dateString: string | Date) => {
    try {
      if (!dateString) {
        return '날짜 정보 없음';
      }

      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const formatted = format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
      return formatted;
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

  // 배경색 선택
  const getBgColorClass = () => {
    switch (notification.type) {
      case NotificationType.SYSTEM:
        return 'bg-blue-50 dark:bg-blue-950/30';
      case NotificationType.TRANSACTION:
        return 'bg-green-50 dark:bg-green-950/30';
      case NotificationType.SERVICE:
        return 'bg-purple-50 dark:bg-purple-950/30';
      case NotificationType.SLOT:
        return 'bg-orange-50 dark:bg-orange-950/30';
      case NotificationType.MARKETING:
        return 'bg-yellow-50 dark:bg-yellow-950/30';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50';
    }
  };

  // 중요도에 따른 테두리 색상 클래스
  const getPriorityBorderClass = () => {
    switch (notification.priority) {
      case NotificationPriority.HIGH:
        return '';
      case NotificationPriority.MEDIUM:
        return '';
      default:
        return '';
    }
  };

  // 보관 처리 함수 - showConfirm 사용
  const handleArchive = () => {
    showConfirm(
      '알림 보관',
      '이 알림을 보관하시겠습니까?',
      async (confirmed) => {
        if (confirmed && onArchive) {
          await onArchive(notification.id);
          toast.info('알림을 보관함으로 이동했습니다');
          onClose();
        }
      },
      {
        confirmText: '보관',
        cancelText: '취소'
      }
    );
  };

  // 삭제 처리 함수 - showConfirm 사용
  const handleDelete = () => {
    showConfirm(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async (confirmed) => {
        if (confirmed && onDelete) {
          await onDelete(notification.id);
          toast.success('알림을 삭제했습니다');
          onClose();
        }
      },
      {
        confirmText: '삭제',
        cancelText: '취소',
        confirmButtonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      }
    );
  };

  if (!notification) return null;

  return (
    <>
      {/* 필요한 스타일을 동적으로 삽입 */}
      <style dangerouslySetInnerHTML={{ __html: modalStyles }} />

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
          }
        }}
      >
        <DialogContent
          className="relative max-w-md notification-modal-content"
          style={{ padding: 0, overflow: 'hidden' }}
          aria-describedby={undefined}
        >
          {/* 닫기 버튼은 Dialog 컴포넌트에 기본으로 포함된 것을 사용 */}

          <DialogHeader className={`${getBgColorClass()} p-4 mb-4 rounded-t-lg`}>
            <div className="flex items-center gap-3">
              <NotificationIcon type={notification.type} size="sm" />
              <div className="flex-1">
                <DialogTitle className="text-lg font-medium">{notification.title}</DialogTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(notification.createdAt)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${notification.type === NotificationType.SYSTEM
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300'
                      : notification.type === NotificationType.TRANSACTION
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-300'
                        : notification.type === NotificationType.SERVICE
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300'
                          : notification.type === NotificationType.SLOT
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300'
                            : notification.type === NotificationType.MARKETING
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/70 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${notification.type === NotificationType.SYSTEM
                        ? 'bg-blue-500 dark:bg-blue-400'
                        : notification.type === NotificationType.TRANSACTION
                          ? 'bg-green-500 dark:bg-green-400'
                          : notification.type === NotificationType.SERVICE
                            ? 'bg-purple-500 dark:bg-purple-400'
                            : notification.type === NotificationType.SLOT
                              ? 'bg-orange-500 dark:bg-orange-400'
                              : notification.type === NotificationType.MARKETING
                                ? 'bg-yellow-500 dark:bg-yellow-400'
                                : 'bg-gray-500 dark:bg-gray-400'
                      }`}></span>
                    {getNotificationTypeText(notification.type)}
                  </span>

                  {/* 중요도 표시 */}
                  {notification.priority === NotificationPriority.HIGH && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                      <span className="mr-1 flex-shrink-0">
                        <i className="ki-notification-bing text-xs"></i>
                      </span>
                      중요
                    </span>
                  )}
                  {notification.priority === NotificationPriority.MEDIUM && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                      <span className="mr-1 flex-shrink-0">
                        <i className="ki-notification text-xs"></i>
                      </span>
                      중간
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="px-4 py-2">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">알림 내용</h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50/50 dark:bg-gray-800/50">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notification.message}</p>
              </div>
            </div>

            {/* 링크가 있는 경우 링크 버튼 표시 */}
            {notification.link && (
              <div className="mb-4">
                <button
                  className="inline-flex items-center px-4 py-1.5 rounded text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                  onClick={() => {
                    // 모달 닫기
                    onClose();

                    // 약간의 지연 후 페이지 이동 (모달이 닫히는 시간 고려)
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
                      // 페이지 이동 시 토스트 메시지 표시
                      toast.info('관련 페이지로 이동합니다');
                    }, 100);
                  }}
                >
                  <i className="ki-external text-sm mr-1.5"></i>
                  관련 페이지로 이동
                </button>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex flex-row justify-between gap-2 items-center px-4 py-3">
            <div className="flex gap-2">
              <button
                className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white px-6"
                onClick={handleArchive}
              >
                보관
              </button>
              <button
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white px-6"
                onClick={handleDelete}
              >
                삭제
              </button>
            </div>
            <button
              className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white px-6"
              onClick={onClose}
            >
              닫기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationDetailModal;