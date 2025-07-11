import clsx from 'clsx';
import { useEffect } from 'react';
import { MegaMenu } from '../mega-menu';
import { HeaderLogo, HeaderTopbar } from './';
import { useStandLayout } from '../';
import { useLocation } from 'react-router';
import ImportantNoticeMarquee from '@/components/notice/ImportantNoticeMarquee';
import { useMediaQuery } from '@/hooks';

const Header = () => {
  const { headerSticky, layout } = useStandLayout();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  useEffect(() => {
    if (headerSticky) {
      document.body.setAttribute('data-sticky-header', 'on');
    } else {
      document.body.removeAttribute('data-sticky-header');
    }
  }, [headerSticky]);

  // 헤더 클릭 시 최상단으로 스크롤
  const handleHeaderClick = (e: React.MouseEvent<HTMLElement>) => {
    // 헤더의 빈 영역을 클릭했을 때만 동작 (버튼이나 링크 클릭은 제외)
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || 
        target.classList.contains('header') || 
        target.classList.contains('flex') ||
        (!target.closest('button') && !target.closest('a') && !target.closest('input'))) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 사이드바 테마에 따라 헤더에도 동일한 테마 적용
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-coal-600'
      : 'dark:bg-coal-600';

  return (
    <>
      <header
        className={clsx(
          'header fixed top-0 z-20 end-0 flex flex-col items-stretch shrink-0 cursor-pointer',
          'bg-light border-b border-b-gray-200 dark:border-b-coal-100', // 사이드바와 같은 배경색 및 하단 구분선 추가
          headerSticky && 'shadow-sm',
          themeClass
        )}
        style={{
          left: isMobile ? '0' : (layout.options.sidebar.collapse ? '80px' : '280px'),
          transition: 'left 0.3s ease',
          width: isMobile ? '100%' : `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})`,
          height: 'var(--header-height)' // 고정 높이로 변경
        }}
        onClick={handleHeaderClick}
      >
        {/* Container 대신 직접 패딩을 적용하여 사이드바 근처에 메뉴가 붙도록 함 */}
        {/* 메인 헤더 영역 */}
        <div className="flex items-stretch w-full px-5 h-16 flex-shrink-0">
          {/* 모바일 영역: 로고 (모바일에서만 표시) */}
          <div className="justify-start lg:hidden flex">
            <HeaderLogo />
          </div>

          {/* 메뉴 영역: PC에서는 왼쪽 정렬 */}
          <div className="flex items-center justify-start lg:pl-0 flex-grow">
            <MegaMenu />
          </div>

          {/* 툴바 영역: 항상 오른쪽 정렬 */}
          <div className="flex items-center justify-end">
            <HeaderTopbar />
          </div>
        </div>
      </header>

      {/* 중요 공지사항 롤링 배너 - 헤더 아래 별도로 고정 */}
      <div
        className="fixed z-20 w-full"
        style={{
          top: 'var(--header-height)',
          left: isMobile ? '0' : (layout.options.sidebar.collapse ? '80px' : '280px'),
          transition: 'left 0.3s ease',
          width: isMobile ? '100%' : `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})`,
        }}
      >
        <ImportantNoticeMarquee />
      </div>
    </>
  );
};

export { Header };