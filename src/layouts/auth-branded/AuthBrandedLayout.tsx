import { Link, Outlet } from 'react-router-dom';
import { Fragment } from 'react';
import { toAbsoluteUrl } from '@/utils';
import useBodyClasses from '@/hooks/useBodyClasses';
import { AuthBrandedLayoutProvider } from './AuthBrandedLayoutProvider';

const Layout = () => {
  // 다크 모드에서 배경색을 관리하기 위한 body 클래스 적용
  useBodyClasses('dark:bg-coal-500');

  return (
    <Fragment>
      <style>
        {`
          .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
            background-size: cover;
            background-position: center center;
            min-height: 100vh;
          }
          .dark .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
          }
        `}
      </style>

      {/* 메트로닉 스타일로 배경과 로그인 폼 배치 */}
      <div className="flex items-center justify-center grow overflow-hidden bg-center bg-cover page-bg h-screen">
        <Outlet />
      </div>
    </Fragment>
  );
};

// AuthBrandedLayout 컴포넌트가 AuthBrandedLayoutProvider로 Layout 컴포넌트를 감싸고 있습니다.
const AuthBrandedLayout = () => (
  <AuthBrandedLayoutProvider>
    <Layout />
  </AuthBrandedLayoutProvider>
);

export { AuthBrandedLayout };
