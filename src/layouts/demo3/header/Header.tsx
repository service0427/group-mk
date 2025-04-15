import { Container } from '@/components/container';
import { HeaderLogo, HeaderTopbar } from '.';

const Header = () => {
  return (
    <header className="flex items-center fixed z-10 top-0 left-0 right-0 shrink-0 h-[--tw-header-height] bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark]">
      <Container className="flex justify-between items-stretch px-5 lg:ps-0 lg:gap-4">
        <HeaderLogo />
        <HeaderTopbar />
      </Container>
    </header>
  );
};

export { Header };
