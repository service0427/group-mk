import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { useDemo1Layout } from '../Demo1LayoutProvider';
import { useMatchPath } from '@/hooks';

const SidebarToggle = () => {
  const { layout, setSidebarCollapse } = useDemo1Layout();
  const { match } = useMatchPath('/dark-sidebar');

  const handleClick = () => {
    if (layout.options.sidebar.collapse) {
      setSidebarCollapse(false);
    } else {
      setSidebarCollapse(true);
    }
  };

  const buttonBaseClass = clsx(
    'btn btn-icon btn-icon-md size-[30px] rounded-lg border bg-light text-gray-500 hover:text-gray-700 toggle absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
    layout.options.sidebar.collapse && 'active'
  );

  const iconClass = clsx(
    'transition-all duration-300',
    layout.options.sidebar.collapse ? 'ltr:rotate-180' : 'rtl:rotate-180'
  );

  const lightToggle = () => {
    return (
      <button
        onClick={handleClick}
        className={clsx(buttonBaseClass, 'border-gray-200 dark:border-gray-300')}
        aria-label="Toggle sidebar"
      >
        <KeenIcon icon="black-left-line" className={iconClass} />
      </button>
    );
  };

  const darkToggle = () => {
    return (
      <div onClick={handleClick}>
        <div className="hidden [html.dark_&]:block">
          <button className={clsx(buttonBaseClass, 'border-gray-300')}>
            <KeenIcon icon="black-left-line" className={iconClass} />
          </button>
        </div>
        <div className="[html.dark_&]:hidden light">{lightToggle()}</div>
      </div>
    );
  };

  return match ? darkToggle() : lightToggle();
};

export { SidebarToggle };
