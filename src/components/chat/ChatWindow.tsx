import React, { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '@/auth';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { IChatRoom, IMessage } from '@/types/chat';
import { KeenIcon } from '@/components/keenicons';

interface ChatWindowProps {
  room: IChatRoom | null;
  messages: IMessage[];
  loading: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  onMinimize?: () => void;
  minimize?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  room,
  messages,
  loading,
  onClose,
  onSend,
  onMinimize,
  minimize = false
}) => {
  const { currentUser } = useAuthContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 관리자 확인
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setIsAdmin(true);
    }
  }, [currentUser]);
  
  // 메시지가 추가되면 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 채팅방 이름 표시
  const getChatRoomName = () => {
    if (!room) return '채팅';
    return room.name || '운영자와의 대화';
  };
  
  // 시간 그룹화를 위한 처리
  const shouldShowTime = (index: number) => {
    if (index === 0) return true;
    
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    
    // 같은 사람의 메시지고 5분 이내면 시간 표시 생략
    if (
      currentMsg.senderId === prevMsg.senderId &&
      new Date(currentMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 5 * 60 * 1000
    ) {
      return false;
    }
    
    return true;
  };
  
  if (minimize) {
    return null;
  }
  
  return (
    <div className="chat-window flex flex-col">
      {/* 헤더 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-primary text-white flex items-center justify-between">
        <h3 className="font-medium text-sm truncate flex-grow">{getChatRoomName()}</h3>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button 
              className="btn btn-icon btn-sm btn-ghost-white size-7 rounded-full flex items-center justify-center"
              onClick={onMinimize}
              aria-label="최소화"
            >
              <KeenIcon icon="minus" />
            </button>
          )}
          <button 
            className="btn btn-icon btn-sm btn-ghost-white size-7 rounded-full flex items-center justify-center"
            onClick={onClose}
            aria-label="닫기"
          >
            <KeenIcon icon="cross" />
          </button>
        </div>
      </div>
      
      {/* 메시지 영역 */}
      <div className="flex-grow p-3 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">메시지 불러오는 중...</div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2 text-4xl">
                <KeenIcon icon="chat-message" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isAdmin
                  ? '아직 메시지가 없습니다. 대화를 시작해보세요.'
                  : '운영자에게 문의하실 내용을 입력해주세요.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                prevMessage={index > 0 ? messages[index - 1] : undefined}
                showTime={shouldShowTime(index)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* 입력 영역 */}
      {room && room.status === 'active' ? (
        <ChatInput
          onSend={onSend}
          disabled={loading || !room}
          placeholder={
            loading
              ? '로딩 중...'
              : !room
              ? '채팅방을 선택해주세요.'
              : isAdmin
              ? '답변을 입력하세요...'
              : '문의하실 내용을 입력하세요...'
          }
        />
      ) : room && room.status !== 'active' ? (
        <div className="p-4 bg-gray-100 border-t text-center text-gray-500 font-medium">
          {room.status === 'closed' ? 
            '이 상담은 종료되었습니다. 새로운 문의는 새 채팅을 시작해주세요.' : 
            room.status === 'archived' ? 
            '이 채팅은 보관 처리되었습니다. 더 이상 메시지를 보낼 수 없습니다.' :
            '이 채팅은 비활성 상태입니다. 더 이상 메시지를 보낼 수 없습니다.'}
        </div>
      ) : (
        <ChatInput
          onSend={onSend}
          disabled={true}
          placeholder={'채팅방을 선택해주세요.'}
        />
      )}
    </div>
  );
};

// React.memo를 사용하여 성능 최적화
export default React.memo(ChatWindow, (prevProps, nextProps) => {
  // room이나 minimize 상태가 변경되었으면 리렌더링
  if (
    prevProps.minimize !== nextProps.minimize ||
    (prevProps.room?.id !== nextProps.room?.id) ||
    (prevProps.room?.updatedAt !== nextProps.room?.updatedAt)
  ) {
    return false;
  }
  
  // loading 상태가 변경되었으면 리렌더링
  if (prevProps.loading !== nextProps.loading) {
    return false;
  }
  
  // 메시지 개수가 다르면 리렌더링
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  
  // 마지막 메시지가 변경되었으면 리렌더링
  if (
    prevProps.messages.length > 0 && 
    nextProps.messages.length > 0 &&
    (prevProps.messages[prevProps.messages.length - 1].id !== 
     nextProps.messages[nextProps.messages.length - 1].id)
  ) {
    return false;
  }
  
  // 그 외에는 리렌더링 하지 않음
  return true;
});