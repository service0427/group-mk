import { forwardRef } from 'react';
import { SidebarMenu } from './';
import { useResponsive } from '@/hooks';

interface Props {
  height?: number;
  onMenuStateChange?: () => void;
}

const SidebarContent = forwardRef<HTMLDivElement, Props>(({ height = 0, onMenuStateChange }, ref) => {
  const isMobile = !useResponsive('up', 'md');
  
  return (
    <div className={`sidebar-content flex grow shrink-0 ${isMobile ? 'py-2' : 'py-3 md:py-5'} pe-2`}>
      <div
        ref={ref}
        id="sidebar-scrollable-container" // 스크롤 컨테이너에 ID 추가
        className={`scrollable-y-hover grow shrink-0 flex ps-2 lg:ps-5 pe-1 lg:pe-3 ${isMobile ? 'mobile-sidebar-content w-full overflow-y-auto hide-scrollbar' : 'overflow-y-auto'}`} // PC에도 overflow-y-auto 추가
        style={{
          ...(height > 0 && !isMobile && { 
            height: `${height}px`,
            // CSS 변수 활용
            maxHeight: 'var(--sidebar-scrollable-height, calc(100vh - 80px))'
          }), // 모바일에서는 height prop 무시
          ...(isMobile && {
            height: '100%', // 부모 높이에 맞춤
            maxHeight: 'calc(100dvh - 40px)', // 동적 뷰포트 높이 사용
            paddingBottom: 'calc(200px + env(safe-area-inset-bottom, 0px))', // iOS Safe Area 포함
            overflowX: 'hidden', // 가로스크롤 방지
            overflowY: 'auto', // 세로 스크롤 명시적 설정
            WebkitOverflowScrolling: 'touch', // iOS 부드러운 스크롤
            msOverflowStyle: 'none',  // 인터넷 익스플로러와 엣지
            scrollbarWidth: 'none'    // 파이어폭스
          }),
          ...(!isMobile && {
            overflowX: 'hidden', // PC에서도 가로스크롤 방지
            // 동적 패딩 계산을 위해 CSS 변수 사용
            paddingBottom: 'max(80px, calc(var(--menu-depth, 0) * 20px + 80px))', // 메뉴 깊이에 따른 동적 패딩
          })
        }}
      >
        <SidebarMenu onMenuStateChange={onMenuStateChange} />
      </div>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

export { SidebarContent };