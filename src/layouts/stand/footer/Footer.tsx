import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router';
import clsx from 'clsx';
import { generalSettings } from '@/config';
import { AdMiscFaqModal } from '@/partials/misc/AdMiscFaqModal';
import { useStandLayout } from '../';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const Footer = () => {
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const { layout } = useStandLayout();
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 스크롤 위치에 따라 푸터 표시 여부 결정
  useEffect(() => {
    // 모바일이 아닌 경우 스크롤 이벤트 감시하지 않음
    if (!isMobile) {
      setIsVisible(true);
      return;
    }

    // SPA에서 실제 스크롤되는 요소 찾기
    const mainContentElement = document.querySelector('main[role="content"]');
    const scrollElement = mainContentElement || window;
    
    // 초기 스크롤 위치 저장
    lastScrollYRef.current = scrollElement === window ? window.scrollY : (mainContentElement?.scrollTop || 0);
    
    // 스크롤 핸들러 함수
    function handleScroll() {
      // 현재 스크롤 위치 (메인 콘텐츠 또는 윈도우)
      const currentScrollY = scrollElement === window 
        ? window.scrollY 
        : (mainContentElement?.scrollTop || 0);
      
      // 이전 스크롤 위치
      const prevScrollY = lastScrollYRef.current;
      
      // 스크롤 방향 (true: 위로, false: 아래로)
      const isScrollingUp = currentScrollY < prevScrollY;
      
      // 화면 상단에 있는지 여부
      const isAtTop = currentScrollY < 100;
      
      // 화면 하단에 있는지 여부
      let isAtBottom = false;
      
      if (scrollElement === window) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        isAtBottom = windowHeight + currentScrollY >= documentHeight - 100;
      } else if (mainContentElement) {
        const containerHeight = mainContentElement.clientHeight;
        const scrollHeight = mainContentElement.scrollHeight;
        isAtBottom = containerHeight + currentScrollY >= scrollHeight - 100;
      }
      
      // 푸터 표시 여부 결정 (위로 스크롤하거나 최하단에 있을 때만 표시)
      if (isScrollingUp || isAtBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      // 현재 스크롤 위치를 이전 위치로 저장
      lastScrollYRef.current = currentScrollY;
    }
    
    // 스크롤 이벤트 리스너 등록
    scrollElement.addEventListener('scroll', handleScroll);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]);
  
  // 사이드바 테마에 따라 푸터에도 동일한 테마 적용
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-coal-600'
      : 'dark:bg-coal-600';
  
  return (
    <footer
      className={clsx(
        'footer fixed bottom-0 z-10 end-0 flex items-stretch shrink-0',
        'bg-light border-t border-t-gray-200 dark:border-t-coal-100', // 사이드바와 같은 배경색 및 상단 구분선 추가
        '!h-10', // !important로 강제 적용
        themeClass
      )}
      style={{
        left: layout.options.sidebar.collapse ? '80px' : '280px',
        transition: 'all 0.3s ease',
        width: `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})`,
        height: '2.5rem !important', // !important로 최우선 적용
        transform: !isVisible && isMobile ? 'translateY(100%)' : 'translateY(0)',
        opacity: !isVisible && isMobile ? 0 : 1
      }}
    >
      {/* Container 대신 직접 패딩을 적용하여 사이드바 근처에 메뉴가 붙도록 함 */}
      <div className="flex items-center justify-between w-full px-4 py-0.5">
        <div className="flex gap-2 font-normal text-2sm">
          <span className="text-gray-500">2025 &copy;</span>
          <a
            href="#"
            className="text-gray-600 hover:text-primary"
          >
            The Standard of Marketing
          </a>
        </div>
        <nav className="flex gap-4 font-normal text-2sm text-gray-600">
          {/* FAQ 링크 */}
          <a 
            href="#" 
            className="hover:text-primary"
            onClick={(e) => {
              e.preventDefault();
              setIsFaqModalOpen(true);
            }}
          >
            FAQ
          </a>
          
          {/* 사이트맵 링크 추가 */}
          <Link 
            to="/sitemap" 
            className="hover:text-primary"
          >
            사이트맵
          </Link>
        </nav>
      </div>
      
      {/* FAQ 모달 */}
      <AdMiscFaqModal 
        isOpen={isFaqModalOpen} 
        onClose={() => setIsFaqModalOpen(false)} 
      />
    </footer>
  );
};

export { Footer };