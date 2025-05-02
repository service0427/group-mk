import React from 'react';
import { KeenIcon } from '@/components/keenicons';

interface ChatIconProps {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

const ChatIcon: React.FC<ChatIconProps> = ({ 
  unreadCount = 0,
  onClick,
  className = ''
}) => {
  return (
    <button 
      className={`chat-icon-button btn btn-icon btn-primary transition-all hover:bg-primary-dark size-14 rounded-full flex items-center justify-center ${className}`}
      onClick={onClick}
      aria-label="채팅"
    >
      <KeenIcon icon="chat-text" className="text-xl" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold shadow">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export { ChatIcon };