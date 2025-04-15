import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo10LayoutProvider, Main } from '.';

const Demo10Layout = () => {
  useBodyClasses(`
    [--tw-page-bg:var(--tw-coal-300)]
    [--tw-content-bg:var(--tw-light)]
    [--tw-content-bg-dark:var(--tw-coal-500)]
    [--tw-content-scrollbar-color:#e8e8e8]
    [--tw-header-height:60px]
    [--tw-sidebar-width:270px]
    bg-[--tw-page-bg]	
    lg:overflow-hidden
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo10LayoutProvider>
      <Main />
    </Demo10LayoutProvider>
  );
};

export { Demo10Layout };
