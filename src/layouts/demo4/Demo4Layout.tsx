import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo4LayoutProvider, Main } from '.';

const Demo4Layout = () => {
  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClasses(`
    [--tw-page-bg:#F6F6F9]
    [--tw-page-bg-dark:var(--tw-coal-200)]
    [--tw-content-bg:var(--tw-light)]
    [--tw-content-bg-dark:var(--tw-coal-500)]
    [--tw-content-scrollbar-color:#e8e8e8]
    [--tw-header-height:60px]
    [--tw-sidebar-width:290px]
    bg-[--tw-page-bg]
    dark:bg-[--tw-page-bg-dark]
    lg:overflow-hidden
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo4LayoutProvider>
      <Main />
    </Demo4LayoutProvider>
  );
};

export { Demo4Layout };
