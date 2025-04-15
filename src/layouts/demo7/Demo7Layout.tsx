import useBodyClasses from '@/hooks/useBodyClasses';
import { Demo7LayoutProvider, Main } from '.';

const Demo7Layout = () => {
  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClasses(`
    [--tw-page-bg:var(--tw-light)]
    [--tw-page-bg-dark:var(--tw-coal-500)]
    [--tw-header-height-default:95px]
    [[data-sticky-header=on]&]:[--tw-header-height:60px]
    [--tw-header-height:--tw-header-height-default]	
    [--tw-header-height-mobile:70px]	
    bg-[--tw-page-bg]
    dark:bg-[--tw-page-bg-dark]
  `);

  return (
    // Providing layout context and rendering the main content
    <Demo7LayoutProvider>
      <Main />
    </Demo7LayoutProvider>
  );
};

export { Demo7Layout };
