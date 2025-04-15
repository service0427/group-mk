import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo8LayoutProvider, Main } from '.';

const Demo8Layout = () => {
  // Using the custom hook to set classes on the body
  useBodyClasses(`
    [--tw-page-bg:#F6F6F9]
    [--tw-page-bg-dark:var(--tw-coal-200)]
    [--tw-content-bg:var(--tw-light)]
    [--tw-content-bg-dark:var(--tw-coal-500)]
    [--tw-content-scrollbar-color:#e8e8e8]
    [--tw-header-height:60px]
    [--tw-sidebar-width:90px]
    bg-[--tw-page-bg]
    dark:bg-[--tw-page-bg-dark]  
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo8LayoutProvider>
      <Main />
    </Demo8LayoutProvider>
  );
};

export { Demo8Layout };
