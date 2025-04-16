import { useLayout } from '@/providers';
import { DashboardPage } from '../origin';
import { Demo1DarkSidebarPage } from '../demo1';

const DefaultPage = () => {
  const { currentLayout } = useLayout();
  
  // 디버깅용 로그
  console.log('현재 레이아웃:', currentLayout?.name);

  // 기본값으로 DashboardPage 사용
  return <DashboardPage />;
};

export { DefaultPage };
