import React from 'react';
import { IChatRoom } from '@/types/chat';
import { KeenIcon } from '@/components/keenicons';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ChatRoomListProps {
  rooms: IChatRoom[];
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  loading: boolean;
}

const ChatRoomList: React.FC<ChatRoomListProps> = ({
  rooms,
  currentRoomId,
  onSelectRoom,
  loading
}) => {
  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      if (isToday(date)) {
        return format(date, 'a h:mm', { locale: ko });
      } else if (isYesterday(date)) {
        return '어제';
      } else {
        return format(date, 'MM.dd', { locale: ko });
      }
    } catch (error) {
      return '';
    }
  };
  
  // 메시지 미리보기 텍스트 처리
  const previewText = (text?: string) => {
    if (!text) return '';
    return text.length > 20 ? text.substring(0, 20) + '...' : text;
  };
  
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="flex justify-center items-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">대화 목록 불러오는 중...</div>
      </div>
    );
  }
  
  if (rooms.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-2 text-4xl">
          <KeenIcon icon="chat-message" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          진행 중인 대화가 없습니다.
        </p>
      </div>
    );
  }
  
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {rooms.map((room) => (
        <li 
          key={room.id}
          className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            currentRoomId === room.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          onClick={() => onSelectRoom(room.id)}
        >
          <div className="px-4 py-3 relative">
            {/* 안 읽은 메시지 배지 */}
            {room.unreadCount && room.unreadCount > 0 ? (
              <span className="absolute right-3 top-3 bg-red-500 text-white text-xs font-medium px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </span>
            ) : null}
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="bg-primary text-white size-10 rounded-full flex items-center justify-center">
                  <KeenIcon icon="user" className="text-lg" />
                </div>
              </div>
              
              <div className="flex-grow min-w-0">
                <h4 className="font-medium text-card-foreground dark:text-white text-sm mb-0.5 truncate">
                  {room.name || '운영자와의 대화'}
                </h4>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground dark:text-gray-400 truncate max-w-[70%]">
                    {previewText(room.lastMessage) || '새로운 대화'}
                  </p>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground dark:text-gray-500">
                      {formatDate(room.lastMessageTime)}
                    </span>
                    
                    {/* 채팅방 상태 표시 */}
                    {room.status && room.status !== 'active' && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                        room.status === 'closed' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                          : room.status === 'archived'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {room.status === 'closed' ? '종료됨' : 
                         room.status === 'archived' ? '보관됨' : '비활성'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ChatRoomList;