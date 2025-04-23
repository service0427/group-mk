import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/supabase';
import { NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification';
import { KeenIcon } from '@/components/keenicons';

interface TestNotificationsButtonProps {
  onComplete?: () => void;
}

const TestNotificationsButton: React.FC<TestNotificationsButtonProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState('dev.junh@gmail.com');
  const [cleanupOldNotifications, setCleanupOldNotifications] = useState(true);

  // 테스트 알림 전송 함수
  const sendTestNotifications = async () => {
    try {
      setLoading(true);
      toast.loading('테스트 알림 준비 중...');

      // 1. 사용자 ID 찾기
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error('사용자를 찾을 수 없습니다:', userError?.message);
        toast.dismiss();
        toast.error(`사용자를 찾을 수 없습니다: ${email}`);
        setLoading(false);
        return false;
      }

      const userId = userData.id;
      toast.loading(`사용자 ID: ${userId} (${email})`);

      // 기존 알림 확인 및 삭제 (선택적)
      if (cleanupOldNotifications) {
        const { data: existingNotifications, error: existingError } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (existingNotifications && existingNotifications.length > 0) {
          toast.loading(`기존 알림(${existingNotifications.length}개) 정리 중...`);

          // 기존 알림 일부 삭제 (남기고 싶은 알림이 있으면 수를 조정)
          const notificationsToDelete = existingNotifications.map(n => n.id);

          if (notificationsToDelete.length > 0) {
            await supabaseAdmin
              .from('notifications')
              .delete()
              .in('id', notificationsToDelete);

            toast.loading(`${notificationsToDelete.length}개의 알림을 정리했습니다.`);
          }
        }
      }

      // 2. 모든 알림 유형과 중요도 조합으로 테스트 알림 생성
      const notificationTypes = [
        NotificationType.SYSTEM,
        NotificationType.TRANSACTION,
        NotificationType.SERVICE,
        NotificationType.SLOT,
        NotificationType.MARKETING
      ];

      const priorities = [
        NotificationPriority.LOW,
        NotificationPriority.MEDIUM,
        NotificationPriority.HIGH
      ];

      // 전송할 알림 배열
      const notifications = [];

      // 모든 유형과 중요도 조합으로 알림 생성
      let index = 0;
      for (const type of notificationTypes) {
        for (const priority of priorities) {
          // 각 알림에 약간 다른 생성 시간을 설정하여 고유성 보장
          const createdAt = new Date();
          // 각 알림마다 1초씩 간격을 둠
          createdAt.setSeconds(createdAt.getSeconds() + index);

          // 랜덤 문자열 추가하여 제목과 메시지를 고유하게 만듦
          const randomId = Math.random().toString(36).substring(2, 8);

          const notification = {
            user_id: userId,
            type,
            title: `[${type}] ${getTypeText(type)} - ${getPriorityText(priority)} 중요도 (${randomId})`,
            message: `이것은 ${getTypeText(type)} 유형의 ${getPriorityText(priority)} 중요도 테스트 알림입니다. (ID: ${randomId})`,
            priority,
            status: NotificationStatus.UNREAD,
            link: priority !== NotificationPriority.LOW ? `/test/${type}?id=${randomId}` : null,
            created_at: createdAt.toISOString(),
          };

          notifications.push(notification);
          index++;
        }
      }

      // 3. 알림 삽입
      toast.loading(`${notifications.length}개의 테스트 알림을 전송합니다...`);
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('알림 전송 중 오류 발생:', insertError.message);
        toast.dismiss();
        toast.error(`알림 전송 중 오류 발생: ${insertError.message}`);
        setLoading(false);
        return false;
      }

      toast.dismiss();
      toast.success(`${notifications.length}개의 테스트 알림이 ${email}에게 전송되었습니다!`);
      setLoading(false);
      setShowConfirm(false);

      // 완료 콜백 호출
      if (onComplete) {
        onComplete();
      }

      return true;
    } catch (error: any) {
      console.error('테스트 알림 전송 중 오류 발생:', error.message);
      toast.dismiss();
      toast.error(`테스트 알림 전송 중 오류 발생: ${error.message}`);
      setLoading(false);
      setShowConfirm(false);
      return false;
    }
  };

  // 알림 유형 텍스트 변환
  const getTypeText = (type: NotificationType) => {
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

  // 중요도 텍스트 변환
  const getPriorityText = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.HIGH:
        return '높음';
      case NotificationPriority.MEDIUM:
        return '중간';
      case NotificationPriority.LOW:
        return '낮음';
      default:
        return '일반';
    }
  };

  return (
    <>
      <button
        className="btn btn-sm btn-info"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
      >
        <KeenIcon icon="code" className="me-2" />
        테스트 알림 전송
      </button>

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">테스트 알림 전송</h3>
            </div>

            <div className="p-4">
              <p className="mb-4">
                다음 이메일 주소로 모든 유형과 중요도의 테스트 알림을 전송합니다:
              </p>

              <input
                type="email"
                className="form-control border border-gray-300 w-full mb-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
              />

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox mr-2"
                    checked={cleanupOldNotifications}
                    onChange={(e) => setCleanupOldNotifications(e.target.checked)}
                  />
                  <span>기존 알림 정리 (먼저 삭제)</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  사용자의 기존 알림을 먼저 삭제하여 중복 오류를 방지합니다.
                </p>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                이 작업은 선택한 사용자에게 15개의 테스트 알림을 전송합니다.
                (5가지 알림 유형 × 3가지 중요도)
              </p>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                className="btn btn-light"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={sendTestNotifications}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    전송 중...
                  </span>
                ) : (
                  '전송하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestNotificationsButton;