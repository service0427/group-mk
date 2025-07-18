import { Fragment, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router';
import { useMenuCurrentItem } from '@/components/menu';
import { Footer, Header, Sidebar, useStandLayout } from '../';
import { useMenus, useLoaders } from '@/providers';
import { ContentLoader } from '@/components/loaders';
import { Chat, ChatSticky } from '@/components/chat';
import { useAuthContext } from '@/auth';
import { useMediaQuery } from '@/hooks';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

const Main = () => {
  const { layout } = useStandLayout();
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const { contentLoader } = useLoaders();
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

  // 컨텐츠 영역의 클래스를 로딩 상태에 따라 동적으로 결정
  const contentClassName = `grow content overflow-y-auto relative pb-10`;

  return (
    <Fragment>
      <Helmet>
        <title>{`마케팅의 정석 :: The standard of Marketing${getPageTitle() ? ` - ${getPageTitle()}` : ''}`}</title>
        {/* 라우트 이동 시 중요한 렌더링 최적화를 위한 메타 태그 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta http-equiv="Cache-Control" content="no-store" />
      </Helmet>

      {/* 사용자 전환 배너 */}
      <ImpersonationBanner />
      
      <div className="flex h-screen h-[100dvh] overflow-hidden">
        {/* 사이드바 컴포넌트 - 고정 영역 */}
        <Sidebar />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="flex grow flex-col overflow-hidden relative">
          {/* 헤더 컴포넌트 - 고정 영역 */}
          <Header />
          
          {/* 스크롤 가능한 콘텐츠 영역 - 동적 영역 */}
          <main className={contentClassName} role="content">
            {/* 컨텐츠 로더가 활성화되면 콘텐츠 영역에만 표시 */}
            {contentLoader && <ContentLoader />}
            
            <div className="content-container">
              <Outlet />
            </div>
          </main>
          
          {/* 푸터 컴포넌트 - 모바일에서는 absolute 위치 */}
          <Footer />
        </div>
        
        {/* 스티키 채팅 아이콘만 사용 */}
        <ChatSticky />
      </div>
    </Fragment>
  );
};

// 사용자 역할 기반 채팅 액세스 제어 컴포넌트
const ChatWithRoleCheck = () => {
  const { currentUser, isAuthenticated } = useAuthContext();
  
  // 인증되지 않은 사용자는 채팅 접근 불가
  if (!isAuthenticated || !currentUser) {
    return null;
  }
  
  // 관리자 또는 일반 사용자만 채팅 접근 가능
  const allowedRoles = ['admin', 'advertiser', 'user', 'distributor', 'operator'];
  
  // 사용자 역할 확인

  if (!currentUser.role || !allowedRoles.includes(currentUser.role)) {
    
    return null;
  }
  
  return <Chat />;
};

export { Main };