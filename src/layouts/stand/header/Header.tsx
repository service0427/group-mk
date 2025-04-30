import clsx from 'clsx';
import { useEffect } from 'react';
import { MegaMenu } from '../mega-menu';
import { HeaderLogo, HeaderTopbar } from './';
import { Breadcrumbs, useStandLayout } from '../';
import { useLocation } from 'react-router';
import ImportantNoticeMarquee from '@/components/notice/ImportantNoticeMarquee';

const Header = () => {
  const { headerSticky, layout } = useStandLayout();
  const { pathname } = useLocation();

  useEffect(() => {
    if (headerSticky) {
      document.body.setAttribute('data-sticky-header', 'on');
    } else {
      document.body.removeAttribute('data-sticky-header');
    }
  }, [headerSticky]);

  // 사이드바 테마에 따라 헤더에도 동일한 테마 적용
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-coal-600'
      : 'dark:bg-coal-600';

  return (
    <>
      <header
        className={clsx(
          'header fixed top-0 z-20 end-0 flex flex-col items-stretch shrink-0',
          'bg-light border-b border-b-gray-200 dark:border-b-coal-100', // 사이드바와 같은 배경색 및 하단 구분선 추가
          headerSticky && 'shadow-sm',
          themeClass
        )}
        style={{
          left: layout.options.sidebar.collapse ? '80px' : '280px',
          transition: 'left 0.3s ease',
          width: `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})`,
          height: 'var(--header-height)' // 고정 높이로 변경
        }}
      >
        {/* Container 대신 직접 패딩을 적용하여 사이드바 근처에 메뉴가 붙도록 함 */}
        {/* 메인 헤더 영역 */}
        <div className="flex items-stretch w-full px-5 h-16 flex-shrink-0">
          {/* 모바일 영역: 로고 (모바일에서만 표시) */}
          <div className="lg:hidden flex items-center">
            <HeaderLogo />
          </div>
          
          {/* 메뉴 영역: PC에서는 왼쪽 정렬 */}
          <div className="flex items-center justify-start lg:pl-0 flex-grow">
            {pathname.includes('/account') ? <Breadcrumbs /> : <MegaMenu />}
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
          left: layout.options.sidebar.collapse ? '80px' : '280px',
          transition: 'left 0.3s ease',
          width: `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})`,
        }}
      >
        <ImportantNoticeMarquee />
      </div>
    </>
  );
};

export { Header };