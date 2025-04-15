import { useEffect } from 'react';
import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo3LayoutProvider, Main } from '.';
import { useSettings } from '@/providers';

const Demo3Layout = () => {
  const { updateSettings } = useSettings();

  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClasses(`
    [--tw-page-bg:#f6f6f6]
    [--tw-page-bg-dark:var(--tw-coal-200)]
    [--tw-content-bg:var(--tw-light)]
    [--tw-content-bg-dark:var(--tw-coal-500)]
    [--tw-content-scrollbar-color:#e8e8e8]
    [--tw-header-height:58px] 
    [--tw-sidebar-width:58px]
    [--tw-navbar-height:56px]
    bg-[--tw-page-bg]
    dark:bg-[--tw-page-bg-dark]
    lg:overflow-hidden
  `);

  useEffect(() => {
    updateSettings({
      container: 'fluid'
    });
  }, []);

  return (
    // Providing layout context and rendering the main content
    <Demo3LayoutProvider>
      <Main />
    </Demo3LayoutProvider>
  );
};

export { Demo3Layout };
