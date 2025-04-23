import { SidebarMenu } from './';
import { useResponsive } from '@/hooks';

interface Props {
  height?: number;
}

const SidebarContent = ({ height = 0 }: Props) => {
  const isMobile = !useResponsive('up', 'md');
  
  return (
    <div className="sidebar-content flex grow shrink-0 py-3 md:py-5 pe-2">
      <div
        className={`scrollable-y-hover grow shrink-0 flex ps-2 lg:ps-5 pe-1 lg:pe-3 ${isMobile ? 'mobile-sidebar-content' : ''}`}
        style={{
          ...(height > 0 && { height: `${height}px` })
        }}
      >
        <SidebarMenu />
      </div>
    </div>
  );
};

export { SidebarContent };