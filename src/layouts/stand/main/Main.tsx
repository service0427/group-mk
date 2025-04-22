import { Fragment, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router';
import { useMenuCurrentItem } from '@/components/menu';
import { Footer, Header, Sidebar, useStandLayout } from '../';
import { useMenus } from '@/providers';

const Main = () => {
  const { layout } = useStandLayout();
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);

  useEffect(() => {
    const bodyClass = document.body.classList;

    // Add a class to the body element
    bodyClass.add('stand');

    if (layout.options.sidebar.fixed) bodyClass.add('sidebar-fixed');
    if (layout.options.sidebar.collapse) bodyClass.add('sidebar-collapse');
    if (layout.options.header.fixed) bodyClass.add('header-fixed');

    // Remove the class when the component is unmounted
    return () => {
      bodyClass.remove('stand');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      bodyClass.remove('header-fixed');
    };
  }, [layout]);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.classList.add('layout-initialized');
    }, 1000); // 1000 milliseconds

    // Remove the class when the component is unmounted
    return () => {
      document.body.classList.remove('layout-initialized');
      clearTimeout(timer);
    };
  }, []);

  // 페이지 타이틀 결정
  const getPageTitle = () => {
    // 알림센터 페이지 경로 확인
    if (pathname === '/notifications') {
      return '알림센터';
    }
    
    // 사이트맵 페이지 경로 확인
    if (pathname === '/sitemap') {
      return '사이트맵';
    }
    
    // 기본적으로 메뉴 아이템의 제목 사용, 없으면 빈 문자열
    return menuItem?.title || '';
  };

  return (
    <Fragment>
      <Helmet>
        <title>{`마케팅의 정석 :: The standard of Marketing${getPageTitle() ? ` - ${getPageTitle()}` : ''}`}</title>
      </Helmet>

      <Sidebar />

      <div className="wrapper flex grow flex-col">
        <Header />

        <main className="grow content pt-5" role="content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </Fragment>
  );
};

export { Main };