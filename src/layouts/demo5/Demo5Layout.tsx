import useBodyClasses from '@/hooks/useBodyClasses';

import { Demo5LayoutProvider, Main } from '.';

const Demo5Layout = () => {
  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClasses(`
    [--tw-header-height:54px]
    [--tw-sidebar-width:200px]
    [--tw-header-bg:var(--tw-light)]
    [--tw-header-bg-dark:var(--tw-coal-500)]
    bg-light 
    dark:bg-coal-500
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo5LayoutProvider>
      <Main />
    </Demo5LayoutProvider>
  );
};

export { Demo5Layout };
