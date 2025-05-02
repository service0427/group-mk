import React from 'react';
import { IMessage, MessageStatus, ChatRole } from '@/types/chat';
import { useAuthContext } from '@/auth';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ChatMessageProps {
  message: IMessage;
  prevMessage?: IMessage;
  showTime?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  prevMessage,
  showTime = true
}) => {
  const { currentUser } = useAuthContext();
  const isMine = message.senderId === currentUser?.id;
  const isSystem = message.senderRole === ChatRole.SYSTEM;
  const isAdmin = message.senderRole === ChatRole.ADMIN;
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'a h:mm', { locale: ko });
    } catch (error) {
      return '';
    }
  };
  
  // 시스템 메시지 렌더링
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-xs text-gray-600 dark:text-gray-300">
          {message.content}
        </div>
      </div>
    );
  }
  
  // 메시지 상태 아이콘
  const renderStatusIcon = () => {
    if (isMine) {
      switch (message.status) {
        case MessageStatus.PENDING:
          return <span className="text-gray-400 text-xs">전송중</span>;
        case MessageStatus.SENT:
          return <KeenIcon icon="check" className="text-gray-400 text-xs" />;
        case MessageStatus.DELIVERED:
          return <KeenIcon icon="check-double" className="text-gray-400 text-xs" />;
        case MessageStatus.READ:
          return <KeenIcon icon="check-double" className="text-primary text-xs" />;
        case MessageStatus.FAILED:
          return <KeenIcon icon="close" className="text-red-500 text-xs" />;
        default:
          return null;
      }
    }
    return null;
  };
  
  // 이름 표시 여부 결정
  const shouldShowName = () => {
    if (isSystem) return false;
    
    // 이전 메시지가 없거나 다른 사람의 메시지인 경우
    if (!prevMessage || prevMessage.senderId !== message.senderId) {
      return true;
    }
    
    return false;
  };
  
  return (
    <div className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isMine ? 'order-1' : 'order-2'}`}>
        {/* 발신자 이름 */}
        {!isMine && shouldShowName() && (
          <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center">
            {message.senderName}
            {isAdmin && (
              <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                관리자
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-end">
          {/* 메시지 상태 (내 메시지인 경우 오른쪽) */}
          {isMine && (
            <div className="text-xs text-gray-500 mr-1 mb-1 dark:text-gray-400 flex items-center">
              {showTime && formatDate(message.timestamp)}
              <span className="ml-1">{renderStatusIcon()}</span>
            </div>
          )}
          
          {/* 메시지 내용 */}
          <div
            className={`px-3 py-2 rounded-lg ${
              isMine
                ? 'bg-primary text-white rounded-tr-none'
                : isAdmin
                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-tl-none'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-tl-none'
            } ${message.isDeleted ? 'italic opacity-60' : ''}`}
          >
            {message.isDeleted ? '삭제된 메시지입니다.' : message.content}
          </div>
          
          {/* 메시지 시간 (내 메시지가 아닌 경우 왼쪽) */}
          {!isMine && (
            <div className="text-xs text-gray-500 ml-1 mb-1 dark:text-gray-400">
              {showTime && formatDate(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 최적화를 위한 memo 사용
export const KeenIcon = ({ icon, className = '' }: { icon: string; className?: string }) => (
  <i className={`ki-${icon} ${className}`}></i>
);

// React.memo를 사용하여 불필요한 리렌더링 방지
// 메시지가 변경되지 않았다면 컴포넌트 리렌더링 하지 않음
export default React.memo(ChatMessage, (prevProps, nextProps) => {
  // 동일한 메시지 ID를 가지고, 상태와 내용이 변경되지 않았으면 리렌더링 하지 않음
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isDeleted === nextProps.message.isDeleted &&
    prevProps.showTime === nextProps.showTime
  );
});