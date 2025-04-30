import React, { useState, useEffect } from 'react';
import { KeenIcon } from '@/components/keenicons';

interface ImportantNotice {
  id: string;
  title: string;
  created_at: string;
}

interface ImportantNoticeMarqueeProps {
  notices: ImportantNotice[];
  onNoticeClick: (noticeId: string) => void;
}

const ImportantNoticeMarquee: React.FC<ImportantNoticeMarqueeProps> = ({ notices, onNoticeClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // 공지사항이 없으면 렌더링하지 않음
  if (!notices || notices.length === 0) {
    return null;
  }

  // 롤링 효과 설정 (5초마다 다음 공지사항으로)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % notices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notices.length]);

  // 현재 표시할 공지사항
  const currentNotice = notices[activeIndex];

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-y border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-2xs font-medium px-1.5 py-0.5 rounded-full mr-2">
              중요 공지
            </span>
            {notices.length > 1 && (
              <div className="text-amber-700 dark:text-amber-300 text-2xs">
                {activeIndex + 1}/{notices.length}
              </div>
            )}
          </div>
          
          <div 
            className="flex-1 overflow-hidden whitespace-nowrap text-amber-900 dark:text-amber-200 text-xs font-medium cursor-pointer hover:underline"
            onClick={() => onNoticeClick(currentNotice.id)}
          >
            {currentNotice.title}
          </div>
          
          {notices.length > 1 && (
            <div className="flex ml-2">
              <button 
                className="p-0.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-full mx-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prevIndex) => (prevIndex - 1 + notices.length) % notices.length);
                }}
                aria-label="이전 공지사항"
              >
                <span className="text-2xs font-medium">&lt;</span>
              </button>
              <button 
                className="p-0.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-full mx-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prevIndex) => (prevIndex + 1) % notices.length);
                }}
                aria-label="다음 공지사항"
              >
                <span className="text-2xs font-medium">&gt;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportantNoticeMarquee;