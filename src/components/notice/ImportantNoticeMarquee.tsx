import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { supabase } from '@/supabase';

interface ImportantNotice {
  id: string;
  title: string;
  created_at: string;
}

const ImportantNoticeMarquee: React.FC = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<ImportantNotice[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 중요 공지사항 가져오기
  useEffect(() => {
    const fetchImportantNotices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notice')
          .select('id, title, created_at')
          .eq('is_active', true)
          .eq('is_important', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setNotices(data || []);
      } catch (err) {
        console.error('중요 공지사항을 가져오는 중 오류가 발생했습니다:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImportantNotices();

    // 주기적으로 공지사항 새로고침 (5분마다)
    const interval = setInterval(fetchImportantNotices, 300000);
    return () => clearInterval(interval);
  }, []);

  // 롤링 효과 설정 (5초마다 다음 공지사항으로)
  useEffect(() => {
    // 공지사항이 있을 때만 롤링 시작
    if (notices.length > 0) {
      const interval = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % notices.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [notices.length]);

  // 공지사항 높이를 CSS 변수로 설정
  useEffect(() => {
    if (notices.length > 0) {
      // 공지사항이 있음을 표시하는 클래스 추가
      document.body.classList.add('has-notice');
      document.documentElement.style.setProperty('--notice-visible', '1');
      document.documentElement.style.setProperty('--notice-height', '36px'); // 9(h-9) * 4 = 36px
    } else {
      // 공지사항이 없는 경우 클래스 제거
      document.body.classList.remove('has-notice');
      document.documentElement.style.setProperty('--notice-visible', '0');
      document.documentElement.style.setProperty('--notice-height', '0px');
    }
    
    return () => {
      // 컴포넌트 언마운트 시 클래스 초기화
      document.body.classList.remove('has-notice');
      document.documentElement.style.setProperty('--notice-visible', '0');
      document.documentElement.style.setProperty('--notice-height', '0px');
    };
  }, [notices.length]);

  // 공지사항 클릭 시 공지사항 상세 페이지로 이동
  const handleNoticeClick = () => {
    if (notices.length > 0) {
      const currentNotice = notices[activeIndex];
      navigate(`/notice?id=${currentNotice.id}`);
    }
  };

  // 공지사항이 없거나 로딩 중이면 렌더링하지 않음
  if (loading || notices.length === 0) {
    return null;
  }

  // 현재 표시할 공지사항
  const currentNotice = notices[activeIndex];

  return (
    <div className="w-full bg-amber-50/90 dark:bg-amber-900/30 border-b border-gray-200 dark:border-coal-100 h-9 flex items-center">
      <div className="w-full px-5">
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
              중요 공지
            </span>
            {notices.length > 1 && (
              <div className="text-amber-700 dark:text-amber-300 text-xs">
                {activeIndex + 1}/{notices.length}
              </div>
            )}
          </div>
          
          <div 
            className="flex-1 overflow-hidden whitespace-nowrap text-amber-900 dark:text-amber-200 text-sm font-medium cursor-pointer hover:underline"
            onClick={handleNoticeClick}
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
                <span className="text-xs font-medium">&lt;</span>
              </button>
              <button 
                className="p-0.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-full mx-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prevIndex) => (prevIndex + 1) % notices.length);
                }}
                aria-label="다음 공지사항"
              >
                <span className="text-xs font-medium">&gt;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportantNoticeMarquee;