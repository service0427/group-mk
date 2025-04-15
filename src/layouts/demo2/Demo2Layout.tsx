import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo2LayoutProvider, Main } from './';

const Demo2Layout = () => {
  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClasses(`
    [--tw-page-bg:var(--tw-light)]
    [--tw-page-bg-dark:var(--tw-coal-500)]
    [--tw-header-height-default:100px]
    [[data-sticky-header=on]&]:[--tw-header-height:60px]
    [--tw-header-height:--tw-header-height-default]	
    bg-[--tw-page-bg]
    dark:bg-[--tw-page-bg-dark]
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo2LayoutProvider>
      <Main />
    </Demo2LayoutProvider>
  );
};

export { Demo2Layout };
