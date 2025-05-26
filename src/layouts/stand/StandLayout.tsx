import useBodyClasses from '@/hooks/useBodyClasses';
import { StandLayoutProvider, Main } from './';

const StandLayout = () => {
  // Using the useBodyClasses hook to set background styles for light and dark modes
  // 모바일에서도 overflow-hidden 적용하여 전체 페이지 스크롤 방지
  useBodyClasses(`
    [--tw-page-bg:#fefefe]
    [--tw-page-bg-dark:var(--tw-coal-500)]
    stand 
    sidebar-fixed 
    header-fixed 
    bg-[--tw-page-bg]
    dark:bg-[--tw-page-bg-dark]
    overflow-hidden
  `);

  return (
    <StandLayoutProvider>
      <Main />
    </StandLayoutProvider>
  );
};

export { StandLayout };