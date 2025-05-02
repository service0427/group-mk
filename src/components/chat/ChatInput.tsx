import React, { useState, useRef, useEffect } from 'react';
import { KeenIcon } from '@/components/keenicons';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...'
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight > 120 ? '120px' : `${scrollHeight}px`;
    }
  }, [message]);
  
  // 메시지 전송 핸들러
  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
      
      // 입력란 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-card">
      <div className="flex items-end gap-2">
        <div className="relative flex-grow">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg resize-none min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card"
            rows={1}
          />
        </div>
        
        <button
          className={`btn btn-icon ${
            message.trim() && !disabled
              ? 'btn-primary'
              : 'btn-gray cursor-not-allowed opacity-60'
          } flex-shrink-0 size-10 rounded-full flex items-center justify-center`}
          onClick={handleSend}
          disabled={!message.trim() || disabled}
        >
          <KeenIcon icon="paper-plane" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;