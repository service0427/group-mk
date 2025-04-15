import { Container } from '@/components/container';
import { NavbarMenu, NavbarLinks } from '..';

const Navbar = () => {
  return (
    <div className="flex items-stretch lg:fixed z-5 top-[--tw-header-height] start-[--tw-sidebar-width] end-5 h-[--tw-navbar-height] mx-5 lg:mx-0 bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark]">
      <div className="rounded-t-xl border border-gray-400 dark:border-gray-200 border-b-gray-300 dark:border-b-gray-200 bg-[--tw-content-bg] dark:bg-[--tw-content-bg-dark] flex items-stretch grow">
        <Container className="flex justify-between items-stretch gap-5">
          <NavbarMenu />
          <NavbarLinks />
        </Container>
      </div>
    </div>
  );
};

export { Navbar };
