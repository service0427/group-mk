import clsx from 'clsx';
import { useEffect } from 'react';
import { MegaMenu } from '../mega-menu';
import { HeaderLogo, HeaderTopbar } from './';
import { Breadcrumbs, useStandLayout } from '../';
import { useLocation } from 'react-router';

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
    <header
      className={clsx(
        'header fixed top-0 z-20 end-0 flex items-stretch shrink-0',
        'bg-light border-b border-b-gray-200 dark:border-b-coal-100', // 사이드바와 같은 배경색 및 하단 구분선 추가
        headerSticky && 'shadow-sm',
        'h-16',
        themeClass
      )}
      style={{
        left: layout.options.sidebar.collapse ? '80px' : '280px',
        transition: 'left 0.3s ease',
        width: `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})`
      }}
    >
      {/* Container 대신 직접 패딩을 적용하여 사이드바 근처에 메뉴가 붙도록 함 */}
      <div className="flex items-stretch w-full px-5">
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
  );
};

export { Header };
