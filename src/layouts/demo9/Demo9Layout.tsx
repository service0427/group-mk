import useBodyClasses from '@/hooks/useBodyClasses';

import { Demo9LayoutProvider, Main } from './';

const Demo9Layout = () => {
  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClasses(`
    [--tw-page-bg-dark:var(--tw-coal-500)]
    [--tw-header-height:78px]
    [--tw-navbar-bg:var(--tw-secondary-active)]
    [--tw-navbar-bg-dark:var(--tw-coal-300)]
    bg-light 
    dark:bg-coal-500
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo9LayoutProvider>
      <Main />
    </Demo9LayoutProvider>
  );
};

export { Demo9Layout };
