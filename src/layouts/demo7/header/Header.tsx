import clsx from 'clsx';
import { Container } from '@/components/container';
import { HeaderLogo, HeaderTopbar } from '.';
import { useDemo7Layout } from '..';
import { useEffect } from 'react';

const Header = () => {
  const { headerSticky } = useDemo7Layout();

  useEffect(() => {
    if (headerSticky) {
      document.body.setAttribute('data-sticky-header', 'on');
    } else {
      document.body.removeAttribute('data-sticky-header');
    }
  }, [headerSticky]);

  return (
    <header
      className={clsx(
        'flex items-center transition-[height] shrink-0 bg-[--tw-page-bg] dark:bg-[--tw-page-bg-dark] py-4 lg:py-0 lg:h-[--tw-header-height]',
        headerSticky &&
          'transition-[height] fixed z-10 top-0 left-0 right-0 shadow-sm backdrop-blur-md bg-white/70 dark:bg-coal-500/70 dark:border-b dark:border-b-coal-100'
      )}
    >
      <Container className="flex flex-wrap gap-2 items-center lg:gap-4">
        <HeaderLogo />
        <HeaderTopbar />
      </Container>
    </header>
  );
};

export { Header };
