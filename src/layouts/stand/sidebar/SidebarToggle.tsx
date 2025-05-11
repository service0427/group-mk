import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { useStandLayout } from '../StandLayoutProvider';

const SidebarToggle = () => {
  const { layout, setSidebarCollapse } = useStandLayout();

  const handleClick = () => {
    if (layout.options.sidebar.collapse) {
      setSidebarCollapse(false);
    } else {
      setSidebarCollapse(true);
    }
  };

  // 공통 클래스만 포함하고 포지셔닝 클래스 제외
  const buttonBaseClass = clsx(
    'btn btn-icon btn-icon-md rounded-lg border bg-light text-gray-500 hover:text-gray-700 toggle',
    layout.options.sidebar.collapse && 'active'
  );

  const iconClass = clsx(
    'transition-all duration-300',
    layout.options.sidebar.collapse ? 'ltr:rotate-180' : 'rtl:rotate-180'
  );

  // 추가 div로 감싸서 다크 모드에서도 위치가 유지되도록 함
  return (
    <div
      style={{
        position: 'absolute',
        left: '100%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99,
        width: '30px',
        height: '30px'
      }}
    >
      <button
        onClick={handleClick}
        className={clsx(buttonBaseClass, 'border-gray-200')}
        aria-label="Toggle sidebar"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0
        }}
      >
        <KeenIcon icon="black-left-line" className={iconClass} />
      </button>
    </div>
  );
};

export { SidebarToggle };