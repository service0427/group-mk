import { Container } from '@/components';
import { MegaMenu } from '../mega-menu';
import { useResponsive } from '@/hooks';

const Navbar = () => {
  const desktopMode = useResponsive('up', 'lg');

  return desktopMode ? (
    <div className="bg-[--tw-navbar-bg] dark:bg-[--tw-navbar-bg-dark] lg:flex lg:items-stretch border-y border-gray-300 dark:border-t-light dark:border-light mb-5 lg:mb-10">
      <Container className="flex flex-wrap justify-between items-center gap-2 px-0 lg:px-7.5">
        <MegaMenu />
      </Container>
    </div>
  ) : (
    <MegaMenu />
  );
};

export { Navbar };
