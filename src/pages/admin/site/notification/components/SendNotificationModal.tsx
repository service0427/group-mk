import React, { useState } from 'react';
import {
  INotification,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '@/types/notification';
import { KeenIcon } from '@/components/keenicons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    link?: string;
    icon?: string;
    expiresAt?: Date | string;
    status: NotificationStatus;
  }) => Promise<void>;
  notificationType: 'role' | 'user';
  selectedUsers?: { id: string, name: string }[];
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  onSend,
  notificationType,
  selectedUsers = []
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState<NotificationType>(NotificationType.SYSTEM);
  const [priority, setPriority] = useState<NotificationPriority>(NotificationPriority.MEDIUM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 입력 유효성 검사
    if (!title.trim()) {
      setError('알림 제목을 입력해주세요.');
      return;
    }

    if (!message.trim()) {
      setError('알림 내용을 입력해주세요.');
      return;
    }

    if (notificationType === 'role' && !document.getElementById('targetRole')) {
      setError('대상 회원 유형을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 알림 데이터 준비
      const notificationData = {
        type,
        title,
        message,
        link: link || undefined,
        priority,
        status: NotificationStatus.UNREAD,
      };

      // 알림 전송
      await onSend(notificationData);

      // 성공적으로 전송된 경우
      onClose();
    } catch (err: any) {
      setError(err.message || '알림 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">
            {notificationType === 'role' ? '권한별 알림 전송' : '회원별 알림 전송'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 bg-background">
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg">
                {error}
              </div>
            )}

            {notificationType === 'role' ? (
              <div className="mb-4">
                <label htmlFor="targetRole" className="block text-sm font-medium text-foreground mb-1">
                  대상 회원 유형
                </label>
                <select
                  id="targetRole"
                  className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>선택하세요</option>
                  <option value="all">전체 회원</option>
                  <option value="developer">개발자</option>
                  <option value="operator">운영자</option>
                  <option value="distributor">총판</option>
                  <option value="agency">대행사</option>
                  <option value="advertiser">광고주</option>
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  선택된 회원 ({selectedUsers.length}명)
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-24 overflow-y-auto border border-gray-200 dark:border-gray-700">
                  {selectedUsers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">선택된 회원이 없습니다</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <span
                          key={user.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-lighter dark:bg-primary-dark text-primary dark:text-primary-light"
                        >
                          {user.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="notificationType" className="block text-sm font-medium text-foreground mb-1">
                알림 타입
              </label>
              <select
                id="notificationType"
                className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                required
              >
                <option value={NotificationType.SYSTEM}>시스템</option>
                <option value={NotificationType.TRANSACTION}>결제/캐시</option>
                <option value={NotificationType.SERVICE}>서비스</option>
                <option value={NotificationType.SLOT}>슬롯</option>
                <option value={NotificationType.MARKETING}>마케팅</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1">
                중요도
              </label>
              <select
                id="priority"
                className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                required
              >
                <option value={NotificationPriority.LOW}>낮음</option>
                <option value={NotificationPriority.MEDIUM}>중간</option>
                <option value={NotificationPriority.HIGH}>높음</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                알림 제목
              </label>
              <input
                id="title"
                type="text"
                className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="알림 제목을 입력하세요"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                알림 내용
              </label>
              <textarea
                id="message"
                className="w-full min-h-[200px] p-3 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="알림 내용을 입력하세요"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="link" className="block text-sm font-medium text-foreground mb-1">
                링크 URL (선택사항)
              </label>
              <input
                id="link"
                type="text"
                className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="예: /notice/123"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white dark:border-primary-light border-t-transparent rounded-full animate-spin mr-2"></span>
                  전송 중...
                </span>
              ) : (
                <>
                  <KeenIcon icon="send" className="mr-1" />
                  알림 전송
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendNotificationModal;