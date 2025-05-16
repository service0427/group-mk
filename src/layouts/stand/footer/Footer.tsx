import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router';
import clsx from 'clsx';
import { generalSettings } from '@/config';
import { AdMiscFaqModal } from '@/partials/misc/AdMiscFaqModal';
import { useStandLayout } from '../';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

const Footer = () => {
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const { layout } = useStandLayout();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 공통 스크롤 가시성 훅 사용
  const isVisible = useScrollVisibility({
    showOnTop: false,
    showOnBottom: true,
    showOnScrollUp: true,
    mobileOnly: true
  });
  
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
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
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