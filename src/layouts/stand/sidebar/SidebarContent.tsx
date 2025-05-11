import { SidebarMenu } from './';
import { useResponsive } from '@/hooks';

interface Props {
  height?: number;
}

const SidebarContent = ({ height = 0 }: Props) => {
  const isMobile = !useResponsive('up', 'md');
  
  return (
    <div className={`sidebar-content flex grow shrink-0 ${isMobile ? 'py-2' : 'py-3 md:py-5'} pe-2`}>
      <div
        id="sidebar-scrollable-container" // 스크롤 컨테이너에 ID 추가
        className={`scrollable-y-hover grow shrink-0 flex ps-2 lg:ps-5 pe-1 lg:pe-3 ${isMobile ? 'mobile-sidebar-content w-full overflow-y-auto hide-scrollbar' : 'overflow-y-auto'}`} // PC에도 overflow-y-auto 추가
        style={{
          ...(height > 0 && { height: `${height}px` }),
          ...(isMobile && {
            height: 'calc(100vh - 40px)', // 모바일에서 높이 제한
            paddingBottom: '100px', // 하단 여백 증가 (40px → 100px)
            overflowX: 'hidden', // 가로스크롤 방지
            msOverflowStyle: 'none',  // 인터넷 익스플로러와 엣지
            scrollbarWidth: 'none'    // 파이어폭스
          }),
          ...(!isMobile && {
            overflowX: 'hidden', // PC에서도 가로스크롤 방지
            paddingBottom: '60px', // PC 환경에서도 하단 여백 추가
          })
        }}
      >
        <SidebarMenu />
      </div>
    </div>
  );
};

export { SidebarContent };